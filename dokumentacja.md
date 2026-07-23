# Dokumentacja Projektu – Uni Calendar

> Uczelniany Kalendarz Zajęć – aplikacja webowa do zarządzania tygodniowymi planami zajęć z funkcją udostępniania planów między użytkownikami, rozbudowana o komunikację w czasie rzeczywistym i system ról.

---

## Spis Treści

1. [Architektura i Infrastruktura](#1-architektura-i-infrastruktura)
2. [Warstwa Danych i Zoptymalizowane Zapytania](#2-warstwa-danych-i-zoptymalizowane-zapytania)
3. [Bezpieczeństwo i Kontrola Dostępu](#3-bezpieczeństwo-i-kontrola-dostępu)
4. [Backend (Spring Boot) i WebSockets](#4-backend-spring-boot-i-websockets)
5. [Frontend (React) i Doświadczenie Użytkownika](#5-frontend-react-i-doświadczenie-użytkownika)
6. [DevOps, Monitoring i Utrzymanie](#6-devops-monitoring-i-utrzymanie)
7. [Uruchomienie Projektu](#7-uruchomienie-projektu)

---

## 1. Architektura i Infrastruktura

### ✅ Konteneryzacja (Docker)

Cała aplikacja działa w izolowanych kontenerach Docker. Każda warstwa ma własny `Dockerfile`:

| Kontener | Obraz bazowy | Rola |
|---|---|---|
| `db` | `postgres:16-alpine` | Baza danych PostgreSQL |
| `redis` | `redis:7-alpine` | Cache + store rate limitingu |
| `backend` | `eclipse-temurin:21-jdk-alpine` | Spring Boot 3.x REST API |
| `frontend` | `node:22-alpine` → `nginx:1.27-alpine` | React SPA (build + serwowanie) |
| `nginx` | `nginx:1.27-alpine` | Reverse proxy, rate limiting, routing WebSocketów |

Uruchomienie całego stosu jedną komendą:
```bash
docker-compose up --build -d
```

### ✅ Wewnętrzne Sieci Docker (Izolacja)

- `db` i `redis` są dostępne **wyłącznie** z sieci wewnętrznej `backend-net` – nikt z zewnątrz nie może się bezpośrednio do nich połączyć.
- `frontend` jest widoczny tylko przez sieć `frontend-net`.
- `nginx` należy do obu sieci, pełniąc rolę bramki, zabezpieczając system przed bezpośrednim dostępem do Spring Boota.

### ✅ Reverse Proxy – Nginx

Nginx jest **jedynym punktem wejścia** z internetu (port 80). Odpowiada za:
- Przekazywanie `/api/` → backend Spring Boot
- Przekazywanie `/ws/` → backend Spring Boot (z odpowiednimi nagłówkami `Upgrade` dla protokołu WebSocket/STOMP)
- Serwowanie React SPA
- Nagłówki bezpieczeństwa HTTP (`X-Frame-Options`, `X-Content-Type-Options`, itp.)
- Rate limiting (ochrona przed Brute Force).

---

## 2. Warstwa Danych i Zoptymalizowane Zapytania

### ✅ Główna Baza Danych – PostgreSQL 16

**Zoptymalizowane Relacje i Modele Danych:**

```
Kalendarz
├── id (UUID, PK)
├── nazwa (String)
├── wlasciciel → User (FK)
├── haslo (String, opcjonalne)
└── CalendarMember (Encja Asocjacyjna dla ról)

CalendarMember
├── id (UUID, PK)
├── user → User (FK)
├── calendar → Kalendarz (FK)
└── role (Enum: COLLABORATOR, FOLLOWER)

Zajęcia (Course)
├── id (Long, PK)
├── calendar → Kalendarz (FK)
├── nazwa, typ, dzien_tygodnia
├── godzina_start, czas_trwania_min
└── data_od, data_do, sala, prowadzacy, notatki

Tablica Ogłoszeń (Notice)
├── id (UUID, PK)
├── calendar → Kalendarz (FK)
├── author → User (FK)
├── content (Text)
└── created_at (Timestamp)
```

### ✅ JPA i Rozwiązanie Problemu N+1 Query

Warstwa dostępu do danych (Hibernate/JPA) została zoptymalizowana, eliminując problem zapytań N+1.
- Wykorzystanie `LEFT JOIN FETCH` w `CalendarRepository` oraz `CourseRepository`.
- Pobieranie głównych zajęć, kalendarzy i subskrybentów ładuje całe grafy obiektów w pojedynczych zapytaniach SQL. To drastycznie zmniejsza obciążenie PostgreSQL.

---

## 3. Bezpieczeństwo i Kontrola Dostępu

### ✅ Uwierzytelnianie (Stateless JWT)

Zaimplementowane w oparciu o filtry bezpieczeństwa Spring Security oraz bibliotekę `jjwt`:
- **Access Token:** Ważny krótko. Służy do autoryzacji zapytań HTTP oraz nawiązywania połączeń WebSocket.
- Przechwytywanie zapytań następuje w locie w `JwtAuthenticationFilter`.

### ✅ Zabezpieczenie Resetu Hasła (PasswordResetToken)

Aby wyeliminować ryzyko kradzieży tożsamości poprzez wyciek starych linków z maila:
- Została stworzona encja `PasswordResetToken` przechowująca jednorazowy, generowany serwerowo klucz (UUID) w bazie danych.
- Token jest rygorystycznie **wygaszany po 15 minutach**.
- Użycie tokenu i fizyczna zmiana hasła automatycznie go usuwają. Proces ten jest jednorazowy i kryptograficznie bezpieczny.

### ✅ System Ról (RBAC)

- **Właściciel:** Automatyczne prawo modyfikacji wszystkiego wewnątrz kalendarza. Dodawanie/usuwanie współpracowników. Limit tworzenia max 5 własnych kalendarzy na użytkownika.
- **Collaborator (Współtwórca):** Posiada pełne prawo do wprowadzania, edycji i usuwania *Zajęć* oraz *Ogłoszeń* w kalendarzu.
- **Follower (Obserwator):** Tylko i wyłącznie tryb do odczytu (READ-ONLY).

---

## 4. Backend (Spring Boot) i WebSockets

### ✅ REST API (Java 21, Spring Boot 3.x)

Backend wystawia w pełni zresteryzowane i zabezpieczone endpointy (zabezpieczone adnotacjami takimi jak `@PreAuthorize` czy walidacją wewnątrz serwisów). Odpowiada za całą logikę autoryzacyjną.

### ✅ Komunikacja Czasu Rzeczywistego (Live Update)

Aplikacja wykorzystuje technologię **WebSockets z protokołem STOMP**, by błyskawicznie przesyłać modyfikacje (utworzenie, edycja, usunięcie) zajęć oraz ogłoszeń:
- **Konfiguracja Brokera:** Punkt wejścia znajduje się pod adresem `/ws`. Działają kolejki na topicach: `/topic/calendar/{id}`.
- **Bezpieczeństwo Połączeń:** Springowy `ChannelInterceptor` (`WebSocketSecurityInterceptor`) w locie, w fazie `CONNECT`, dekoduje token JWT. Odrzuca intruzów bez ważnego tokenu z nagłówka, chroniąc cały kanał.
- **Rozsyłanie Wiadomości:** Elementy modyfikujące stan (np. `CourseService` czy `NoticeService`) na zakończenie transakcji wysyłają powiadomienie (`messagingTemplate.convertAndSend`) wraz z nowym obiektem.

### ✅ Tablica Ogłoszeń (Noticeboard)

Dołożony moduł do natychmiastowej komunikacji we współdzielonym kalendarzu. Odciąża standardowe opisy zajęć poprzez umożliwienie wrzucania notyfikacji (np. *"Dziś odwołane"*, *"Przenosimy do sali A"*). Składa się z kontrolera, serwisu z obsługą STOMP oraz encji zintegrowanej z bazą danych.

---

## 5. Frontend (React) i Doświadczenie Użytkownika

### ✅ Architektura Frontendu

- **React 18** + **Vite 6** (Błyskawiczne środowisko deweloperskie i mały footprint).
- Interfejs w terminalowym designie (klimat retro-CLI / neonowy granat + błękit). Niestandardowe, "pikselowe" paski przewijania (scrollbary) pasujące do siatki.
- Axios z globalnymi interceptorami automatycznie przechwytującymi tokeny Bearer JWT z localStorage.

### ✅ Integracja Hooka useStomp

- Wdrożony Custom Hook `useStomp` (bazujący na `@stomp/stompjs` oraz fallbackach `sockjs-client`). 
- W momencie wejścia użytkownika do widoku, następuje podpięcie go do subskrypcji wydarzeń z jego kalendarza bazowego.
- Zmiany po stronie serwera aplikowane są bez odświeżania strony (automatyczne aktualizacje na komponentach).

### ✅ Moduł Tablicy Ogłoszeń w UI

Na głównym widoku (WeekPage) osadzony jest komponent `<Noticeboard />`. Widok wspiera ułożenie z panelem pobocznym (dzięki Flexbox: `.week-layout`). 

---

## 6. DevOps, Monitoring i Utrzymanie

- Pliki wdrożeniowe Docker odizolowane, odseparowane konfiguracjami `.env`. 
- **Baza PostgreSQL:** Wymaga tylko standardowych regularnych zrzutów (np. cron z `pg_dump`).
- Serwer w architekturze "Stateless" – można bezproblemowo duplikować i load-balancować warstwę Spring Boota dla uzyskania większej dostępności.

---

## 7. Uruchomienie Projektu

Masz dwie ścieżki wdrożenia:

**1. Szybki start i produkcja (Docker):**
```bash
docker-compose up --build -d
```
Aplikacja będzie dostępna pod adresem: `http://localhost`. Wszystko – baza, backend, frontend i proxy – podniesie się samodzielnie.

**2. Środowisko deweloperskie (HMR, LiveReload):**
- Wystartuj tylko bazę danych w tle: `docker-compose up db -d`
- W jednym terminalu postaw Spring Boota: `cd backend-spring` i uruchom `.\mvnw spring-boot:run`
- W drugim terminalu podnieś Reacta: `cd frontend`, zainstaluj paczki poleceniem `npm install` i wpisz `npm run dev` (dostęp pod adresem `http://localhost:5173`).

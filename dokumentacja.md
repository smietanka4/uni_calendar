# Dokumentacja Projektu - Uni Calendar

> Uczelniany Kalendarz Zajec - aplikacja webowa do zarzadzania tygodniowymi planami zajec z funkcja udostepniania rozkladow miedzy uzytkownikami, komunikacja w czasie rzeczywistym i kontrola dostepu oparta na rolach.

---

## Spis Tresci

1. [Architektura i Infrastruktura](#1-architektura-i-infrastruktura)
2. [Warstwa Danych i Zoptymalizowane Zapytania](#2-warstwa-danych-i-zoptymalizowane-zapytania)
3. [Bezpieczenstwo i Kontrola Dostepu](#3-bezpieczenstwo-i-kontrola-dostepu)
4. [Backend (Spring Boot) i WebSockets](#4-backend-spring-boot-i-websockets)
5. [Frontend (React) i Architektura Interfejsu](#5-frontend-react-i-architektura-interfejsu)
6. [Konfiguracja Domeny i Utrzymanie](#6-konfiguracja-domeny-i-utrzymanie)
7. [Uruchomienie Projektu](#7-uruchomienie-projektu)

---

## 1. Architektura i Infrastruktura

### Konteneryzacja (Docker)

Aplikacja dziala w izolowanych kontenerach Docker:

| Kontener | Obraz bazowy | Rola |
|---|---|---|
| `db` | `postgres:16-alpine` | Baza danych PostgreSQL |
| `redis` | `redis:7-alpine` | Cache oraz magazyn rate limitingu |
| `backend` | `eclipse-temurin:21-jdk-alpine` | Spring Boot 3.4 REST API + WebSockets |
| `frontend` | `node:22-alpine` -> `nginx:1.27-alpine` | React SPA (build produkcyjny + serwowanie statyczne) |
| `nginx` | `nginx:1.27-alpine` | Reverse proxy, rate limiting, routing WebSocketow i obsluga domeny |

Uruchomienie calego stosu:
```bash
docker-compose up --build -d
```

### Wewnetrzne Sieci Docker (Izolacja)

- `db` i `redis` sa dostepne wylacznie w sieci wewnetrznej `backend-net`.
- `frontend` jest widoczny wylacznie przez siec `frontend-net`.
- `nginx` nalezy do obu sieci i pelni role jedynego punktu wejscia z internetu.

### Reverse Proxy - Nginx

Nginx nasluchuje na portach 80/443 i odpowiada za:
- Przekazywanie `/api/` do serwera Spring Boot
- Przekazywanie `/ws/` do serwera Spring Boot z naglowkami `Upgrade` dla protokolu WebSocket/STOMP
- Obsluge weryfikacji certyfikatow SSL pod `/.well-known/acme-challenge/` dla domeny niestandardowej
- Serwowanie aplikacji React SPA
- Naglowki bezpieczenstwa HTTP (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`)
- Rate limiting dla endpointow API oraz logowania/rejestracji

---

## 2. Warstwa Danych i Zoptymalizowane Zapytania

### Glowna Baza Danych - PostgreSQL 16

Relacje i modele danych:

```
Calendar
├── id (UUID, PK)
├── nazwa (String)
├── wlasciciel -> User (FK)
├── haslo (String, opcjonalne)
└── CalendarMember (Encja asocjacyjna dla rol)

CalendarMember
├── id (UUID, PK)
├── user -> User (FK)
├── calendar -> Calendar (FK)
└── role (Enum: COLLABORATOR, FOLLOWER)

Course (Zajecia)
├── id (Long, PK)
├── calendar -> Calendar (FK)
├── nazwa, typ, dzien_tygodnia
├── godzina_start, czas_trwania_min
└── data_od, data_do, sala, prowadzacy, notatki

Notice (Tablica Ogloszen)
├── id (UUID, PK)
├── calendar -> Calendar (FK)
├── author -> User (FK)
├── content (Text)
└── created_at (Timestamp)
```

### Optymalizacja JPA (Brak problemu N+1 Query)

Warstwa dostepu do danych wykorzystuje `LEFT JOIN FETCH` w `CalendarRepository` oraz `CourseRepository`. Pobieranie zajec, kalendarzy i listy subskrybentow laduje powiazane encje w pojedynczych zapytaniach SQL.

---

## 3. Bezpieczenstwo i Kontrola Dostepu

### Uwierzytelnianie (Stateless JWT)

Zaimplementowane w oparciu o Spring Security oraz biblioteke `jjwt`:
- **Access Token:** Krotkotrwaly token sluzacy do autoryzacji zapytan HTTP oraz polaczen WebSocket.
- **Refresh Token:** Pozwala na automatyczne odnowienie sesji przez interceptor Axios.

### Reset Hasla (PasswordResetToken)

- Encja `PasswordResetToken` przechowuje jednorazowy klucz UUID w bazie danych.
- Token wygasa automatycznie po 15 minutach lub natychmiast po zmianie hasla.

### System Rol (RBAC)

- **Wlasciciel:** Pelne prawo modyfikacji kalendarza oraz zarzadzania dostepem uzytkownikow. Limit 5 wlasnych kalendarzy na konto.
- **Collaborator (Wspoltworca):** Prawo do dodawania, edycji i usuwania zajec oraz ogloszen.
- **Follower (Obserwator):** Dostep wylacznie w trybie tylko do odczytu (READ-ONLY).

---

## 4. Backend (Spring Boot) i WebSockets

### REST API (Java 21, Spring Boot 3.4)

Backend udostepnia endpointy REST zabezpieczone walidacja uprawnien w warstwie serwisowej.

### Komunikacja Czasu Rzeczywistego (WebSockets / STOMP)

- Punkt wejscia znajduje sie pod adresem `/ws`, a subskrypcje dzialaja na kanalach `/topic/calendar/{id}`.
- `WebSocketSecurityInterceptor` weryfikuje token JWT podczas fazy `CONNECT`.
- Po kazdej operacji utworzenia, edycji lub usuniecia zajec czy ogloszenia serwis rozglasza zdarzenie przez `SimpMessagingTemplate`.

---

## 5. Frontend (React) i Architektura Interfejsu

- **React 19** + **Vite 6** + **React Router 7**.
- Чиsty, techniczny design oparty o czytelna siatke, wysoki kontrast, ostre krawedzie i typografie `Inter` oraz `JetBrains Mono` (bez animacji kursora, emotikonow i sztucznych ozdobnikow).
- Wbudowane strony prawne: Polityka Prywatnosci (`/polityka-prywatnosci`) oraz Regulamin (`/regulamin`), dostepne zarowno dla zalogowanych, jak i niezalogowanych uzytkownikow.
- Obsluga favicona SVG (`/favicon.svg`) oraz konfiguracji domeny (`public/CNAME`).

---

## 6. Konfiguracja Domeny i Utrzymanie

- Konfiguracja srodowiska produkcyjnego odbywa sie poprzez plik `.env` (`DOMAIN_NAME`, `FRONTEND_URL`, `CORS_ALLOWED_ORIGINS`).
- Serwer dziala bezstanowo (Stateless JWT), co umozliwia skalowanie horyzontalne warstwy backendowej.

---

## 7. Uruchomienie Projektu

**1. Srodowisko produkcyjne / Docker:**
```bash
docker-compose up --build -d
```
Aplikacja bedzie dostepna pod adresem `http://localhost` lub pod skonfigurowana domena.

**2. Srodowisko deweloperskie:**
- Uruchom baze danych i Redis: `docker-compose up db redis -d`
- Uruchom backend: `cd backend-spring && ./mvnw spring-boot:run`
- Uruchom frontend: `cd frontend && npm install && npm run dev` (dostep pod `http://localhost:5173`).

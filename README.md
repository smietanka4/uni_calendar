# Uni Calendar - Uczelniany Kalendarz Współdzielony

Nowoczesna aplikacja webowa typu SPA (Single Page Application) stworzona do zarządzania plikami zajęć z funkcją współdzielenia, komunikacji w czasie rzeczywistym i tablicą ogłoszeń. 

Aplikacja oparta na zaawansowanej architekturze serwerowej **Spring Boot (Java 21)** oraz wysoce reaktywnym interfejsie w **React.js**. Całość infrastruktury uruchamiana jest z wykorzystaniem kontenerów **Docker**.

## Funkcjonalności

- ✅ **Bezpieczna Autoryzacja:** Rejestracja, logowanie oraz resetowanie haseł oparte o krótkotrwałe tokeny wędrujące przez JWT (JSON Web Tokens) chroniące przed podsłuchiwaniem i kradzieżą dostępu.
- ✅ **Zarządzanie Kalendarzami z Limitem:** Limit 5 kalendarzy per użytkownik. Ogranicza obciążenie bazy. 
- ✅ **System Ról i Uprawnień (RBAC):**
  - **Właściciel / Collaborator (Współtwórca):** Pełne prawa do tworzenia, edycji i usuwania lekcji i wiadomości.
  - **Follower (Obserwator):** Widzi nałożone plany w trybie tylko do odczytu (READ-ONLY).
- ✅ **Live Update / WebSockets:** Pełna integracja z protokołem STOMP w Spring Boot oraz własny hook `useStomp` na froncie. Kiedy jeden użytkownik edytuje kalendarz, wszystkie strony podłączonych użytkowników natychmiast odświeżają się bez ręcznego przeładowywania.
- ✅ **Tablica Ogłoszeń (Noticeboard):** Dynamiczne okno przyklejone do kalendarza na komunikaty grupy (odwoływanie zajęć, zmiany sal). Działa na żywo w oparciu o sieć WebSockets.
- ✅ **Rozwiązany Problem N+1 Query:** Zoptymalizowane encje i zapytania JPQL z `JOIN FETCH`, które skracają czas odpowiedzi bazy PostgreSQL do minimum.

## Wymagania

- [Docker](https://www.docker.com/) oraz Docker Compose
- *Opcjonalnie (do pracy bez dockera)*: Java 21, Maven/MavenWrapper, Node.js v22+

## Szybkie Uruchomienie (Zalecane)

Uruchomienie kompletnego środowiska opartego na pięciu współpracujących serwisach (Baza PostgreSQL, Redis, Backend API, Frontend Node, Reverse Proxy Nginx).

1. Upewnij się, że masz skopiowany plik środowiskowy i zmienione hasła (szczególnie JWT):
```bash
cp .env.example .env
```
2. Skompiluj i odpal maszyny w tle jednym poleceniem:
```bash
docker-compose up --build -d
```
3. Otwórz w przeglądarce: **http://localhost**
   *Nginx automatycznie przekieruje zapytania /api i /ws do serwera Spring Boot i wyświetli front w Reakcie.*

## Struktura projektu

```
uni_calendar/
├── docker-compose.yml     # Architektura maszyn i sieci
├── .env.example           # Bezpieczne wstrzykiwanie haseł
├── backend-spring/        # Backend w Spring Boot
│   ├── src/main/java/com/unicalendar/
│   │   ├── config/        # Konfiguracja (Bezpieczeństwo JWT, WebSockets, CORS)
│   │   ├── controller/    # Warstwa wejściowa REST
│   │   ├── model/         # Tabele (Course, Calendar, Notice, User, Members)
│   │   ├── repository/    # Optymalizacja JPA
│   │   └── service/       # Główna logika i uwierzytelnianie
│   └── pom.xml            # Drzewo zależności Mavena
├── frontend/              # Frontend React
│   ├── src/
│   │   ├── api/           # Klient HTTP z Axios
│   │   ├── hooks/         # Customowe rozwiązania (np. useStomp)
│   │   ├── pages/         # Widoki 
│   │   └── App.jsx        # Routing i warstwa autoryzacji
│   ├── package.json
│   └── vite.config.js
├── nginx/                 # Warstwa ochronna Nginx (Reverse Proxy)
└── dokumentacja.md        # Kompletna, ogromna dokumentacja architektury
```

## Technologie

### Backend
- **Java 21** / **Spring Boot 3.4.1**
- **Spring Data JPA** & **Hibernate**
- **Spring Security** (Bezstanowa autoryzacja z użyciem biblioteki `jjwt`)
- **Spring WebSockets / STOMP**
- Baza danych: **PostgreSQL 16**

### Frontend
- **React.js 18**
- **Vite 6** (Superszybkie narzędzie budujące)
- **React Router 6**
- Klient HTTP: **Axios** z interceptorami
- Websockets: **@stomp/stompjs** + **sockjs-client**

### Architektura
- Konteneryzacja: **Docker** i **Docker Compose**
- Serwer w roli fasady bezpieczeństwa: **Nginx**

## Zgłaszanie problemów i Rozwój
Aplikacja została poddana gruntownej modernizacji, gdzie stary kod pythona i sqllite'a został wyrzucony na rzecz skalowalnego Java Spring Boot API. Szczegółowe zestawienie architektoniczne i raport pokontrolny znajdziesz w pliku `dokumentacja.md`.

# Uni Calendar - Uczelniany Kalendarz Wspoldzielony

Aplikacja webowa typu SPA (Single Page Application) stworzona do zarzadzania tygodniowymi planami zajec akademickich z funkcja wspoldzielenia w grupach studenckich, synchronizacja w czasie rzeczywistym i tablica ogloszen.

System oparty jest na architekturze serwerowej **Spring Boot (Java 21)** oraz interfejsie **React.js**. Calosc infrastruktury uruchamiana jest z wykorzystaniem kontenerow **Docker**.

## Funkcjonalnosci

- **Autoryzacja JWT:** Rejestracja, logowanie oraz resetowanie hasel oparte o krotkotrwale tokeny dostepowe i odswiezajace (JSON Web Tokens).
- **Zarzadzanie Kalendarzami z Limitem:** Limit 5 wlasnych kalendarzy na uzytkownika w celu zachowania wydajnosci bazy danych.
- **System Rol i Uprawnien (RBAC):**
  - **Wlasciciel / Collaborator (Wspoltworca):** Pelne prawa do tworzenia, edycji i usuwania zajec oraz publikowania ogloszen.
  - **Follower (Obserwator):** Podglad nalozonych planow w trybie tylko do odczytu (READ-ONLY).
- **Synchronizacja Live (WebSockets / STOMP):** Integracja z protokolem STOMP w Spring Boot oraz hook `useStomp` na froncie. Zmiany w kalendarzu oraz nowe komunikaty sa natychmiast przesylane do podlaczonych uzytkownikow.
- **Tablica Ogloszen (Noticeboard):** Panel przypiety do widoku tygodniowego sluzacy do przekazywania informacji grupowych (odwolane zajecia, zmiany sal).
- **Optymalizacja Zapytan JPA:** Wyeliminowany problem N+1 Query dzieki zapytaniom JPQL z `LEFT JOIN FETCH`.
- **Dokumenty Prawne i Konfiguracja Domeny:** Wbudowane podstrony Polityki Prywatnosci (`/polityka-prywatnosci`) oraz Regulaminu (`/regulamin`), a takze konfiguracja Nginx i CNAME gotowa do podlaczenia domeny niestandardowej.

## Wymagania

- [Docker](https://www.docker.com/) oraz Docker Compose
- *Opcjonalnie (do pracy bez Dockera)*: Java 21, Maven Wrapper, Node.js v22+

## Szybkie Uruchomienie

Uruchomienie srodowiska opartego na pieciu wspolpracujacych serwisach (PostgreSQL, Redis, Backend API, Frontend SPA, Reverse Proxy Nginx):

1. Skopiuj plik srodowiskowy i uzupelnij dane konfiguracyjne (szczegolnie `JWT_SECRET`, `POSTGRES_PASSWORD` oraz `DOMAIN_NAME`):
```bash
cp .env.example .env
```
2. Zbuduj i uruchom kontenery w tle:
```bash
docker-compose up --build -d
```
3. Otworz w przegladarce adres: **http://localhost** (lub skonfigurowana domene).

## Podlaczenie Domeny Niestandardowej (Custom Domain)

1. Skieruj rekordy DNS typu `A` (dla domeny glownej np. `unicalendar.pl`) oraz `CNAME` (dla `www.unicalendar.pl`) na publiczny adres IP serwera.
2. W pliku `.env` ustaw zmienne:
   - `DOMAIN_NAME=unicalendar.pl`
   - `FRONTEND_URL=https://unicalendar.pl`
   - `CORS_ALLOWED_ORIGINS=https://unicalendar.pl,https://www.unicalendar.pl`
3. W pliku `nginx/nginx.conf` dyrektywa `server_name` oraz katalog `/.well-known/acme-challenge/` sa skonfigurowane pod weryfikacje certyfikatow SSL (Let's Encrypt / Certbot). Dla hostingu statycznego w katalogu `frontend/public/CNAME` znajduje sie plik definicji domeny.

## Struktura projektu

```
uni_calendar/
├── docker-compose.yml     # Definicja kontenerow i sieci
├── .env.example           # Szablon zmiennych srodowiskowych
├── .github/workflows/     # Pipeline CI/CD (GitHub Actions)
├── backend-spring/        # Backend Spring Boot (Java 21)
│   ├── src/main/java/com/unicalendar/
│   │   ├── config/        # Bezpieczenstwo JWT, WebSockets, CORS
│   │   ├── controller/    # Endpointy REST API
│   │   ├── model/         # Encje JPA (Course, Calendar, Notice, User, CalendarMember)
│   │   ├── repository/    # Repozytoria JPA
│   │   └── service/       # Logika biznesowa i autoryzacja
│   ├── src/test/          # Testy jednostkowe JUnit 5
│   └── pom.xml            # Konfiguracja Maven
├── frontend/              # Frontend React + Vite
│   ├── public/            # Favicon SVG oraz plik CNAME
│   ├── src/
│   │   ├── api/           # Klient HTTP Axios z obsluga odswiezania JWT
│   │   ├── components/    # Nawigacja, stopka, ochrona tras
│   │   ├── hooks/         # Hook WebSocket useStomp
│   │   ├── pages/         # Widoki aplikacji oraz strony prawne
│   │   └── App.jsx        # Routing aplikacji
│   ├── package.json
│   └── vite.config.js
├── tests/unit/            # Testy jednostkowe Python (pytest)
├── nginx/                 # Konfiguracja Reverse Proxy i Rate Limiting
└── dokumentacja.md        # Dokumentacja architektoniczna
```

## Uruchamianie testow

### Python
```bash
python -m pytest tests/unit/ -v
```

### Spring Boot
```bash
cd backend-spring
./mvnw test
```

### Frontend
```bash
cd frontend
npm install
npm test -- --run
```

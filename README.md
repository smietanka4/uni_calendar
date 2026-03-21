# Uni Calendar - Personalizowany Kalendarz

Pełna aplikacja webowa z backendem (Flask) i frontendem (React) do zarządzania personalizowanym kalendarzem wydarzeń.

## Funkcjonalności

- ✅ Rejestracja i logowanie użytkowników
- ✅ Tworzenie, edycja i usuwanie wydarzeń
- ✅ Pełna personalizacja wydarzeń:
  - Data i godzina rozpoczęcia oraz zakończenia
  - Kolor wydarzenia
  - Opis wydarzenia
  - Powtarzanie wydarzeń (codziennie, co tydzień, co miesiąc, co rok)
  - Ustawienie interwału powtarzania (np. co 2 tygodnie)
  - Data końca powtarzania lub liczba wystąpień
- ✅ Widok kalendarza miesięcznego
- ✅ Intuicyjny interfejs użytkownika

## Struktura projektu

```
uni_calendar/
├── backend/
│   ├── app.py                 # Główny plik aplikacji Flask
│   ├── requirements.txt       # Zależności Pythona
│   └── calendar.db           # Baza danych SQLite (tworzona automatycznie)
├── frontend/
│   ├── src/
│   │   ├── components/       # Komponenty React
│   │   ├── contexts/         # Context API (AuthContext)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Instalacja i uruchomienie

### Backend (Flask)

1. Przejdź do katalogu backend:
```bash
cd backend
```

2. Zainstaluj zależności:
```bash
pip install -r requirements.txt
```

3. Uruchom serwer:
```bash
python app.py
```

Backend będzie dostępny pod adresem: http://localhost:5000

### Frontend (React)

1. Przejdź do katalogu frontend:
```bash
cd frontend
```

2. Zainstaluj zależności:
```bash
npm install
```

3. Uruchom serwer deweloperski:
```bash
npm run dev
```

Frontend będzie dostępny pod adresem: http://localhost:3000

## API Endpoints

### Autentykacja

- `POST /api/register` - Rejestracja nowego użytkownika
- `POST /api/login` - Logowanie użytkownika
- `GET /api/user` - Pobranie informacji o zalogowanym użytkowniku (wymaga autoryzacji)

### Wydarzenia

- `GET /api/events?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD` - Pobranie wydarzeń (wymaga autoryzacji)
- `POST /api/events` - Utworzenie nowego wydarzenia (wymaga autoryzacji)
- `GET /api/events/<id>` - Pobranie konkretnego wydarzenia (wymaga autoryzacji)
- `PUT /api/events/<id>` - Aktualizacja wydarzenia (wymaga autoryzacji)
- `DELETE /api/events/<id>` - Usunięcie wydarzenia (wymaga autoryzacji)

## Przykładowe użycie API

### Rejestracja użytkownika

```bash
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "jan",
    "email": "jan@example.com",
    "password": "haslo123"
  }'
```

### Utworzenie wydarzenia

```bash
curl -X POST http://localhost:5000/api/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Spotkanie",
    "description": "Opis spotkania",
    "start_time": "2024-01-15T10:00:00",
    "end_time": "2024-01-15T11:00:00",
    "recurrence_type": "weekly",
    "recurrence_interval": 1,
    "color": "#3788d8"
  }'
```

## Technologie

### Backend
- Flask - framework webowy
- Flask-SQLAlchemy - ORM do bazy danych
- Flask-JWT-Extended - autoryzacja JWT
- Flask-CORS - obsługa CORS
- SQLite - baza danych
- python-dateutil - obsługa powtarzania wydarzeń

### Frontend
- React - biblioteka UI
- React Router - routing
- Axios - klient HTTP
- date-fns - obsługa dat
- Vite - narzędzie buildowania

## Uwagi bezpieczeństwa

⚠️ **WAŻNE**: To jest aplikacja deweloperska. Przed wdrożeniem produkcyjnym:

1. Zmień `SECRET_KEY` i `JWT_SECRET_KEY` w `backend/app.py`
2. Użyj właściwej bazy danych (PostgreSQL, MySQL) zamiast SQLite
3. Zaimplementuj HTTPS
4. Dodaj walidację po stronie serwera
5. Zaimplementuj rate limiting
6. Dodaj obsługę błędów i logowanie

## Licencja

MIT

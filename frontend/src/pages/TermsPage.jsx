import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './LegalPage.css'

export default function TermsPage() {
  const { user } = useAuth()

  return (
    <div className="page legal-page" style={!user ? { paddingTop: '2rem' } : undefined}>
      <div className="legal-nav-bar">
        <Link to={user ? '/' : '/login'} className="btn btn-ghost btn-sm">
          Powrót do aplikacji
        </Link>
        <Link to="/polityka-prywatnosci" className="btn btn-ghost btn-sm">
          Przejdź do Polityki Prywatności
        </Link>
      </div>

      <div className="card">
        <header className="legal-header">
          <h1>Regulamin Świadczenia Usług (Terms &amp; Conditions)</h1>
          <div className="legal-meta">Ostatnia aktualizacja: 15 listopada 2026 r.</div>
        </header>

        <section className="legal-section">
          <h2>1. Postanowienia ogólne</h2>
          <p>
            Niniejszy Regulamin określa zasady korzystania z internetowego systemu Uni Calendar,
            przeznaczonego do tworzenia tygodniowych rozkładów zajęć akademickich, ich
            współdzielenia w grupach studenckich oraz publikowania komunikatów organizacyjnych.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Warunki techniczne i rejestracja konta</h2>
          <ul>
            <li>
              Do korzystania z aplikacji wymagana jest przeglądarka internetowa z obsługą
              JavaScript oraz połączenie sieciowe umożliwiające komunikację HTTPS i WebSocket.
            </li>
            <li>
              Rejestracja wymaga podania unikalnej nazwy użytkownika, prawidłowego adresu e-mail
              oraz hasła. Użytkownik zobowiązany jest do zachowania poufności danych logowania.
            </li>
            <li>
              W celu zapewnienia stabilności bazy danych jedno konto użytkownika może utworzyć
              maksymalnie 5 własnych kalendarzy.
            </li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>3. Zasady współdzielenia planów i uprawnienia</h2>
          <p>System realizuje kontrolę dostępu opartą na rolach (RBAC):</p>
          <ul>
            <li>
              <strong>Właściciel (Owner):</strong> posiada pełne uprawnienia do dodawania, edycji i
              usuwania zajęć, zarządzania hasłem dostępowym kalendarza oraz zapraszania i usuwania
              członków grupy.
            </li>
            <li>
              <strong>Współtwórca (Collaborator):</strong> posiada uprawnienia do edycji zajęć oraz
              publikowania komunikatów na tablicy ogłoszeń współdzielonego planu.
            </li>
            <li>
              <strong>Obserwator (Follower):</strong> posiada dostęp wyłącznie w trybie do odczytu
              (READ-ONLY), pozwalający na nałożenie obserwowanego planu na własną siatkę tygodniową.
            </li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>4. Dopuszczalne użytkowanie i Tablica Ogłoszeń</h2>
          <p>
            Użytkownik ponosi pełną odpowiedzialność za treści wprowadzane w opisach zajęć oraz na
            tablicy ogłoszeń. Zabronione jest:
          </p>
          <ul>
            <li>Publikowanie treści bezprawnych, obraźliwych lub wprowadzających grupę w błąd.</li>
            <li>
              Podejmowanie prób ominięcia zabezpieczeń autoryzacji JWT, filtrów kanałów WebSocket
              lub limitów zapytań (rate limiting).
            </li>
            <li>
              Automatyczne generowanie nadmiarowego ruchu sieciowego obciążającego infrastrukturę
              serwera.
            </li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>5. Dostępność usługi i odpowiedzialność</h2>
          <p>
            System Uni Calendar jest narzędziem pomocniczym wspierającym organizację studiów.
            Wiążącym źródłem informacji o terminach zajęć, salach oraz zaliczeniach pozostają
            oficjalne systemy dziekanatowe danej uczelni. Administrator dokłada starań, aby usługa
            działała w sposób ciągły, jednak zastrzega prawo do krótkich przerw technicznych
            związanych z aktualizacją oprogramowania lub konserwacją bazy danych.
          </p>
        </section>

        <section className="legal-section">
          <h2>6. Postanowienia końcowe</h2>
          <p>
            Naruszenie postanowień niniejszego Regulaminu, w szczególności działania naruszające
            bezpieczeństwo innych użytkowników lub stabilność serwera, może skutkować zablokowaniem
            lub usunięciem konta. W sprawach nieuregulowanych niniejszym Regulaminem zastosowanie
            mają właściwe przepisy prawa polskiego.
          </p>
        </section>
      </div>
    </div>
  )
}

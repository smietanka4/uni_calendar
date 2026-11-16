import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './LegalPage.css'

export default function PrivacyPolicyPage() {
  const { user } = useAuth()

  return (
    <div className="page legal-page" style={!user ? { paddingTop: '2rem' } : undefined}>
      <div className="legal-nav-bar">
        <Link to={user ? '/' : '/login'} className="btn btn-ghost btn-sm">
          Powrót do aplikacji
        </Link>
        <Link to="/regulamin" className="btn btn-ghost btn-sm">
          Przejdź do Regulaminu
        </Link>
      </div>

      <div className="card">
        <header className="legal-header">
          <h1>Polityka Prywatności</h1>
          <div className="legal-meta">Ostatnia aktualizacja: 15 listopada 2026 r.</div>
        </header>

        <section className="legal-section">
          <h2>1. Informacje ogólne</h2>
          <p>
            Niniejsza Polityka Prywatności określa zasady przetwarzania i ochrony danych osobowych
            użytkowników korzystających z aplikacji webowej Uni Calendar, służącej do tworzenia,
            organizacji oraz współdzielenia tygodniowych planów zajęć akademickich.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Zakres zbieranych danych</h2>
          <p>
            System gromadzi wyłącznie dane niezbędne do świadczenia funkcji harmonogramu oraz
            autoryzacji konta użytkownika:
          </p>
          <ul>
            <li>
              <strong>Dane konta:</strong> nazwa użytkownika (login), adres e-mail (wykorzystywany
              do procedury odzyskiwania dostępu do konta) oraz hasło przechowywane wyłącznie w
              postaci skrótu kryptograficznego BCrypt.
            </li>
            <li>
              <strong>Dane harmonogramu:</strong> wprowadzone przez użytkownika przedmioty, typy
              zajęć, godziny rozpoczęcia, czas trwania, sale, prowadzący, zakresy dat oraz notatki.
            </li>
            <li>
              <strong>Dane współdzielenia i komunikacji:</strong> przynależność do współdzielonych
              kalendarzy, przypisane role dostępu (Właściciel, Współtwórca, Obserwator) oraz wpisy
              publikowane na tablicy ogłoszeń grupy.
            </li>
            <li>
              <strong>Dane techniczne i bezpieczeństwa:</strong> adres IP wykorzystywany tymczasowo
              w warstwie serwera proxy Nginx oraz pamięci podręcznej Redis w celu ochrony przed
              atakami typu brute-force (rate limiting).
            </li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>3. Cel i podstawa przetwarzania danych</h2>
          <p>
            Dane przetwarzane są w celu realizacji usługi drogą elektroniczną (art. 6 ust. 1 lit. b
            RODO), obejmującej utrzymanie konta użytkownika, synchronizację zmian w czasie
            rzeczywistym przez protokół WebSocket (STOMP) oraz obsługę jednorazowych tokenów
            resetowania hasła (ważnych przez 15 minut od wygenerowania).
          </p>
        </section>

        <section className="legal-section">
          <h2>4. Pamięć lokalna przeglądarki (Local Storage)</h2>
          <p>
            Aplikacja nie wykorzystuje zewnętrznych plików cookies o charakterze reklamowym ani
            śledzącym. W pamięci lokalnej przeglądarki (<code>localStorage</code>) zapisywane są
            wyłącznie krótkotrwałe tokeny autoryzacyjne JWT (<code>access</code> i{' '}
            <code>refresh</code>) oraz podstawowy identyfikator zalogowanego konta. Wylogowanie z
            systemu powoduje natychmiastowe usunięcie tych danych z przeglądarki.
          </p>
        </section>

        <section className="legal-section">
          <h2>5. Udostępnianie danych innym użytkownikom</h2>
          <p>
            Domyślnie plan zajęć jest prywatny. Dane zajęć oraz nazwa właściciela kalendarza stają
            się widoczne dla innych zalogowanych użytkowników wyłącznie wtedy, gdy właściciel
            przekaże im identyfikator UUID swojego planu (oraz opcjonalne hasło dostępu) lub
            zaprosi konkretnego użytkownika po jego nazwie konta. Właściciel może w dowolnej chwili
            odebrać dostęp wybranym osobom lub zmienić hasło dostępowe planu.
          </p>
        </section>

        <section className="legal-section">
          <h2>6. Prawa użytkownika</h2>
          <p>
            Każdy użytkownik ma prawo dostępu do swoich danych, ich samodzielnego sprostowania,
            edycji lub usunięcia poszczególnych zajęć i ogłoszeń bezpośrednio w interfejsie
            aplikacji, a także prawo do żądania całkowitego usunięcia konta z bazy danych PostgreSQL.
          </p>
        </section>
      </div>
    </div>
  )
}

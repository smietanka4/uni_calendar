"""
Konsolowy Kalendarz Uniwersytecki
Główny plik uruchomieniowy z interaktywnym menu w języku polskim.

Uruchomienie:
    cd src
    python main.py
"""

from __future__ import annotations
import os
import sys
from datetime import date, timedelta

# Upewnij się, że Python znajdzie moduły w katalogu src/
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from calendar import KalendarzUczelniany
from event import Zajecia, TYPY_ZAJEC, DNI_TYGODNIA


# ══════════════════════════════════════════════════════════════════════
# Pomocnicze funkcje wyświetlania
# ══════════════════════════════════════════════════════════════════════

SZEROKOSC = 70
SEP = "═" * SZEROKOSC
SEP_CIENKI = "─" * SZEROKOSC


def wyczysc() -> None:
    os.system("cls" if os.name == "nt" else "clear")


def naglowek(tytul: str) -> None:
    print(f"\n{SEP}")
    print(f"  {'KALENDARZ UNIWERSYTECKI':^{SZEROKOSC - 4}}")
    print(f"  {tytul:^{SZEROKOSC - 4}}")
    print(SEP)


def nacisnij_enter() -> None:
    input("\n  Naciśnij ENTER, aby kontynuować...")


def blad(komunikat: str) -> None:
    print(f"\n  [!] {komunikat}")


def sukces(komunikat: str) -> None:
    print(f"\n  [✓] {komunikat}")


# ══════════════════════════════════════════════════════════════════════
# Parsowanie i walidacja wejścia
# ══════════════════════════════════════════════════════════════════════

def wczytaj_date(prompt: str, domyslna: date | None = None) -> date:
    """Prosi użytkownika o datę w formacie DD.MM.YYYY."""
    while True:
        tekst = input(prompt).strip()
        if not tekst and domyslna is not None:
            return domyslna
        try:
            dzien, miesiac, rok = tekst.split(".")
            return date(int(rok), int(miesiac), int(dzien))
        except (ValueError, AttributeError):
            blad("Nieprawidłowy format daty. Użyj DD.MM.YYYY, np. 16.04.2026")


def wczytaj_godzine(prompt: str) -> str:
    """Prosi o godzinę w formacie HH:MM."""
    while True:
        tekst = input(prompt).strip()
        try:
            h, m = tekst.split(":")
            if 0 <= int(h) <= 23 and 0 <= int(m) <= 59:
                return f"{int(h):02d}:{int(m):02d}"
            raise ValueError
        except ValueError:
            blad("Nieprawidłowy format godziny. Użyj HH:MM, np. 14:00")


def wczytaj_int(prompt: str, min_val: int, max_val: int) -> int:
    while True:
        try:
            w = int(input(prompt).strip())
            if min_val <= w <= max_val:
                return w
            blad(f"Podaj liczbę od {min_val} do {max_val}.")
        except ValueError:
            blad("To nie jest liczba.")


# ══════════════════════════════════════════════════════════════════════
# Formatowanie zajęć
# ══════════════════════════════════════════════════════════════════════

def formatuj_zajecia_karta(z: Zajecia, nr: int | None = None) -> None:
    """Wyświetla szczegóły zajęć w formie karty."""
    prefix = f"[{nr}] " if nr is not None else "    "
    print(f"\n  {prefix}ID: {z.id}  |  {z.typ}")
    print(f"      Nazwa:       {z.nazwa}")
    print(f"      Dzień:       {z.nazwadzien()}")
    print(f"      Godzina:     {z.godzina_start} – {z.godzina_koniec()} ({z.czas_trwania_min} min)")
    print(f"      Sala:        {z.sala}")
    print(f"      Prowadzący:  {z.prowadzacy}")
    print(f"      Okres:       {z.data_od.strftime('%d.%m.%Y')} – {z.data_do.strftime('%d.%m.%Y')}")
    if z.notatki:
        print(f"      Notatki:     {z.notatki}")
    print(f"  {SEP_CIENKI}")


# ══════════════════════════════════════════════════════════════════════
# Widok tygodniowy
# ══════════════════════════════════════════════════════════════════════

def pokaz_tydzien(kal: KalendarzUczelniany) -> None:
    naglowek("── Widok tygodniowy ──")

    dzisiaj = date.today()
    domyslna_str = dzisiaj.strftime("%d.%m.%Y")
    print(f"\n  Podaj dowolną datę z wybranego tygodnia (domyślnie: {domyslna_str}):")
    wybrana = wczytaj_date("  >> ", domyslna=dzisiaj)

    poniedzialek = wybrana - timedelta(days=wybrana.weekday())
    niedziela = poniedzialek + timedelta(days=6)

    print(f"\n  Tydzień: {poniedzialek.strftime('%d.%m.%Y')} – {niedziela.strftime('%d.%m.%Y')}\n")

    wyniki = kal.pobierz_zajecia_tygodnia(wybrana)

    if not wyniki:
        print("  Brak zajęć w tym tygodniu.")
        nacisnij_enter()
        return

    # Grupuj wg dnia
    dni: dict[date, list[tuple[Zajecia, date]]] = {}
    for z, d in wyniki:
        dni.setdefault(d, []).append((z, d))

    for d in sorted(dni):
        nazwa_dnia = DNI_TYGODNIA[d.weekday()].upper()
        print(f"  ┌─ {nazwa_dnia}, {d.strftime('%d.%m.%Y')} {'─' * (SZEROKOSC - 22)}")
        for z, _ in dni[d]:
            print(f"  │  {z.godzina_start}–{z.godzina_koniec()}  [{z.typ[:3].upper()}]  {z.nazwa}")
            print(f"  │           Sala: {z.sala}  |  {z.prowadzacy}")
            if z.notatki:
                print(f"  │           Notatki: {z.notatki}")
        print(f"  └{'─' * (SZEROKOSC - 4)}")

    nacisnij_enter()


# ══════════════════════════════════════════════════════════════════════
# Dodawanie zajęć
# ══════════════════════════════════════════════════════════════════════

def dodaj_zajecia(kal: KalendarzUczelniany) -> None:
    naglowek("── Dodaj nowe zajęcia ──")

    print("\n  Nazwa przedmiotu:")
    nazwa = input("  >> ").strip()
    if not nazwa:
        blad("Nazwa nie może być pusta.")
        nacisnij_enter()
        return

    print("\n  Typ zajęć:")
    for i, t in enumerate(TYPY_ZAJEC, 1):
        print(f"    [{i}] {t}")
    typ_idx = wczytaj_int("  >> ", 1, len(TYPY_ZAJEC)) - 1
    typ = TYPY_ZAJEC[typ_idx]

    print("\n  Dzień tygodnia:")
    for i, d in enumerate(DNI_TYGODNIA, 0):
        print(f"    [{i}] {d}")
    dzien = wczytaj_int("  >> ", 0, 6)

    print("\n  Godzina rozpoczęcia (HH:MM):")
    godzina = wczytaj_godzine("  >> ")

    print("\n  Czas trwania (w minutach):")
    czas = wczytaj_int("  >> ", 15, 480)

    print("\n  Data PIERWSZYCH zajęć (DD.MM.YYYY):")
    data_od = wczytaj_date("  >> ")

    print("\n  Data OSTATNICH zajęć (DD.MM.YYYY):")
    while True:
        data_do = wczytaj_date("  >> ")
        if data_do >= data_od:
            break
        blad("Data końcowa musi być późniejsza niż data początkowa.")

    print("\n  Numer sali:")
    sala = input("  >> ").strip() or "–"

    print("\n  Prowadzący:")
    prowadzacy = input("  >> ").strip() or "–"

    print("\n  Notatki / opis (opcjonalnie, ENTER aby pominąć):")
    notatki = input("  >> ").strip()

    z = Zajecia(
        nazwa=nazwa,
        typ=typ,
        dzien_tygodnia=dzien,
        godzina_start=godzina,
        czas_trwania_min=czas,
        data_od=data_od,
        data_do=data_do,
        sala=sala,
        prowadzacy=prowadzacy,
        notatki=notatki,
    )

    print(f"\n{SEP_CIENKI}")
    print("  Podgląd zajęć przed zapisem:")
    formatuj_zajecia_karta(z)

    daty = z.get_daty_wystapien()
    print(f"  Liczba wystąpień: {len(daty)}")
    if daty:
        print(f"  Pierwsze: {daty[0].strftime('%d.%m.%Y')}  |  Ostatnie: {daty[-1].strftime('%d.%m.%Y')}")

    print("\n  Zapisać? [t/n]")
    if input("  >> ").strip().lower() in ("t", "tak", "y", "yes"):
        kal.dodaj_zajecia(z)
        sukces(f"Zajęcia '{nazwa}' zostały dodane (ID: {z.id}).")
    else:
        print("  Anulowano.")

    nacisnij_enter()


# ══════════════════════════════════════════════════════════════════════
# Lista wszystkich zajęć
# ══════════════════════════════════════════════════════════════════════

def lista_wszystkich(kal: KalendarzUczelniany) -> None:
    naglowek("── Wszystkie zajęcia ──")
    wszystkie = kal.pobierz_wszystkie()

    if not wszystkie:
        print("\n  Brak dodanych zajęć.")
        nacisnij_enter()
        return

    # Sortuj: dzien_tygodnia, godzina
    wszystkie.sort(key=lambda z: (z.dzien_tygodnia, z.godzina_start))
    for i, z in enumerate(wszystkie, 1):
        formatuj_zajecia_karta(z, nr=i)

    nacisnij_enter()


# ══════════════════════════════════════════════════════════════════════
# Wyszukiwanie
# ══════════════════════════════════════════════════════════════════════

def szukaj_zajec(kal: KalendarzUczelniany) -> None:
    naglowek("── Wyszukiwanie zajęć ──")
    print("\n  Wpisz frazę (nazwa, prowadzący, sala, notatki):")
    fraza = input("  >> ").strip()
    if not fraza:
        nacisnij_enter()
        return

    wyniki = kal.szukaj(fraza)
    if not wyniki:
        print(f"\n  Nie znaleziono zajęć pasujących do: '{fraza}'")
    else:
        print(f"\n  Znaleziono {len(wyniki)} wynik(ów):")
        for i, z in enumerate(wyniki, 1):
            formatuj_zajecia_karta(z, nr=i)

    nacisnij_enter()


# ══════════════════════════════════════════════════════════════════════
# Usuwanie zajęć
# ══════════════════════════════════════════════════════════════════════

def usun_zajecia(kal: KalendarzUczelniany) -> None:
    naglowek("── Usuń zajęcia ──")
    wszystkie = kal.pobierz_wszystkie()

    if not wszystkie:
        print("\n  Brak zajęć do usunięcia.")
        nacisnij_enter()
        return

    wszystkie.sort(key=lambda z: (z.dzien_tygodnia, z.godzina_start))
    for i, z in enumerate(wszystkie, 1):
        formatuj_zajecia_karta(z, nr=i)

    print(f"\n  Podaj numer zajęć do usunięcia (1–{len(wszystkie)}) lub ENTER aby anulować:")
    tekst = input("  >> ").strip()
    if not tekst:
        print("  Anulowano.")
        nacisnij_enter()
        return

    try:
        idx = int(tekst) - 1
        z = wszystkie[idx]
    except (ValueError, IndexError):
        blad("Nieprawidłowy numer.")
        nacisnij_enter()
        return

    print(f"\n  Na pewno usunąć '{z.nazwa}' (ID: {z.id})? [t/n]")
    if input("  >> ").strip().lower() in ("t", "tak", "y"):
        if kal.usun_zajecia(z.id):
            sukces(f"Usunięto zajęcia '{z.nazwa}'.")
        else:
            blad("Nie udało się usunąć.")
    else:
        print("  Anulowano.")

    nacisnij_enter()


# ══════════════════════════════════════════════════════════════════════
# Menu główne
# ══════════════════════════════════════════════════════════════════════

def menu_glowne(kal: KalendarzUczelniany) -> None:
    while True:
        wyczysc()
        dzisiaj = date.today()
        print(f"\n{SEP}")
        print(f"  {'KALENDARZ UNIWERSYTECKI':^{SZEROKOSC - 4}}")
        print(f"  {dzisiaj.strftime('%A, %d.%m.%Y'):^{SZEROKOSC - 4}}")
        print(f"  Liczba zajęć w bazie: {len(kal.pobierz_wszystkie())}")
        print(SEP)
        print()
        print("   [1]  Widok tygodniowy")
        print("   [2]  Dodaj nowe zajęcia")
        print("   [3]  Wyświetl wszystkie zajęcia")
        print("   [4]  Wyszukaj zajęcia")
        print("   [5]  Usuń zajęcia")
        print("   [0]  Wyjście")
        print()
        print(SEP_CIENKI)

        wybor = input("  Wybierz opcję: ").strip()

        if wybor == "1":
            wyczysc()
            pokaz_tydzien(kal)
        elif wybor == "2":
            wyczysc()
            dodaj_zajecia(kal)
        elif wybor == "3":
            wyczysc()
            lista_wszystkich(kal)
        elif wybor == "4":
            wyczysc()
            szukaj_zajec(kal)
        elif wybor == "5":
            wyczysc()
            usun_zajecia(kal)
        elif wybor == "0":
            print("\n  Do zobaczenia!\n")
            break
        else:
            blad("Nieznana opcja. Spróbuj ponownie.")
            nacisnij_enter()


# ══════════════════════════════════════════════════════════════════════
# Punkt wejścia
# ══════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    kal = KalendarzUczelniany()
    menu_glowne(kal)

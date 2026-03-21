"""
Moduł: calendar.py
Klasa KalendarzUczelniany zarządza listą zajęć i deleguje persystencję do storage.py.
"""

from __future__ import annotations
from datetime import date, timedelta
from event import Zajecia
import storage


class KalendarzUczelniany:
    def __init__(self) -> None:
        self._zajecia: list[Zajecia] = storage.wczytaj()

    # ------------------------------------------------------------------
    # Operacje CRUD
    # ------------------------------------------------------------------

    def dodaj_zajecia(self, z: Zajecia) -> None:
        self._zajecia.append(z)
        storage.zapisz(self._zajecia)

    def usun_zajecia(self, zajecia_id: str) -> bool:
        przed = len(self._zajecia)
        self._zajecia = [z for z in self._zajecia if z.id != zajecia_id]
        if len(self._zajecia) < przed:
            storage.zapisz(self._zajecia)
            return True
        return False

    def pobierz_wszystkie(self) -> list[Zajecia]:
        return list(self._zajecia)

    # ------------------------------------------------------------------
    # Widok tygodniowy
    # ------------------------------------------------------------------

    def pobierz_zajecia_tygodnia(self, dowolna_data: date) -> list[tuple[Zajecia, date]]:
        """
        Zwraca posortowaną listę (zajecia, konkretna_data) dla tygodnia
        zawierającego podaną datę (pon–nd).
        """
        # Oblicz poniedziałek danego tygodnia
        poniedzialek = dowolna_data - timedelta(days=dowolna_data.weekday())
        niedziela = poniedzialek + timedelta(days=6)

        wyniki: list[tuple[Zajecia, date]] = []
        for z in self._zajecia:
            for d in z.get_daty_wystapien():
                if poniedzialek <= d <= niedziela:
                    wyniki.append((z, d))

        wyniki.sort(key=lambda x: (x[1], x[0].godzina_start))
        return wyniki

    # ------------------------------------------------------------------
    # Wyszukiwanie
    # ------------------------------------------------------------------

    def szukaj(self, fraza: str) -> list[Zajecia]:
        fraza = fraza.lower()
        return [
            z for z in self._zajecia
            if fraza in z.nazwa.lower()
            or fraza in z.prowadzacy.lower()
            or fraza in z.sala.lower()
            or fraza in z.notatki.lower()
        ]

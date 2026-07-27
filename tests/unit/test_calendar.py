"""
Testy jednostkowe dla klasy KalendarzUczelniany.
"""

import sys
import os
import unittest
from datetime import date
from unittest.mock import patch, MagicMock

# Dodaj src/ do ścieżki
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "src"))

from event import Zajecia
from calendar import KalendarzUczelniany
import storage

class TestKalendarzUczelniany(unittest.TestCase):

    def setUp(self):
        self.patcher_wczytaj = patch("storage.wczytaj", return_value=[])
        self.mock_wczytaj = self.patcher_wczytaj.start()
        
        self.patcher_zapisz = patch("storage.zapisz")
        self.mock_zapisz = self.patcher_zapisz.start()
        
        self.kalendarz = KalendarzUczelniany()

    def tearDown(self):
        self.patcher_wczytaj.stop()
        self.patcher_zapisz.stop()

    def _przykladowe(self, id="123") -> Zajecia:
        return Zajecia(
            nazwa="Programowanie",
            typ="Wykład",
            dzien_tygodnia=0, # poniedzialek
            godzina_start="10:00",
            czas_trwania_min=90,
            data_od=date(2026, 4, 1),
            data_do=date(2026, 6, 30),
            sala="1.01",
            prowadzacy="Jan Kowalski",
            notatki="Test notatki",
            id=id
        )

    def test_dodaj_zajecia(self):
        z = self._przykladowe()
        self.kalendarz.dodaj_zajecia(z)
        self.assertEqual(len(self.kalendarz.pobierz_wszystkie()), 1)
        self.assertIn(z, self.kalendarz.pobierz_wszystkie())
        self.mock_zapisz.assert_called_once()
        self.mock_zapisz.assert_called_with([z])

    def test_usun_zajecia_istniejace(self):
        z = self._przykladowe(id="abc")
        self.kalendarz.dodaj_zajecia(z)
        self.mock_zapisz.reset_mock()
        
        wynik = self.kalendarz.usun_zajecia("abc")
        self.assertTrue(wynik)
        self.assertEqual(len(self.kalendarz.pobierz_wszystkie()), 0)
        self.mock_zapisz.assert_called_once_with([])

    def test_usun_zajecia_nieistniejace(self):
        z = self._przykladowe(id="abc")
        self.kalendarz.dodaj_zajecia(z)
        self.mock_zapisz.reset_mock()
        
        wynik = self.kalendarz.usun_zajecia("nie_ma")
        self.assertFalse(wynik)
        self.assertEqual(len(self.kalendarz.pobierz_wszystkie()), 1)
        self.mock_zapisz.assert_not_called()

    def test_pobierz_wszystkie_zwraca_kopie(self):
        z = self._przykladowe()
        self.kalendarz.dodaj_zajecia(z)
        lista = self.kalendarz.pobierz_wszystkie()
        lista.clear()
        self.assertEqual(len(self.kalendarz.pobierz_wszystkie()), 1)

    def test_pobierz_zajecia_tygodnia(self):
        # 6 April 2026 is Monday
        z = self._przykladowe()
        # Ensure the date covers the requested week
        z.data_od = date(2026, 4, 6)
        z.data_do = date(2026, 4, 12)
        z.dzien_tygodnia = 0 # pon
        self.kalendarz.dodaj_zajecia(z)
        
        # Searching by Wednesday 2026-04-08 (same week)
        wyniki = self.kalendarz.pobierz_zajecia_tygodnia(date(2026, 4, 8))
        self.assertEqual(len(wyniki), 1)
        z_wynik, d_wynik = wyniki[0]
        self.assertEqual(z_wynik.id, z.id)
        self.assertEqual(d_wynik, date(2026, 4, 6))

    def test_pobierz_zajecia_tygodnia_brak(self):
        z = self._przykladowe()
        z.data_od = date(2026, 4, 6)
        z.data_do = date(2026, 4, 6)
        z.dzien_tygodnia = 0
        self.kalendarz.dodaj_zajecia(z)
        
        # Inny tydzien
        wyniki = self.kalendarz.pobierz_zajecia_tygodnia(date(2026, 4, 15))
        self.assertEqual(len(wyniki), 0)

    def test_szukaj_nazwa(self):
        z = self._przykladowe()
        self.kalendarz.dodaj_zajecia(z)
        wyniki = self.kalendarz.szukaj("programowanie")
        self.assertEqual(len(wyniki), 1)

    def test_szukaj_prowadzacy(self):
        z = self._przykladowe()
        self.kalendarz.dodaj_zajecia(z)
        wyniki = self.kalendarz.szukaj("Kowalski")
        self.assertEqual(len(wyniki), 1)

    def test_szukaj_sala(self):
        z = self._przykladowe()
        self.kalendarz.dodaj_zajecia(z)
        wyniki = self.kalendarz.szukaj("1.01")
        self.assertEqual(len(wyniki), 1)

    def test_szukaj_notatki(self):
        z = self._przykladowe()
        self.kalendarz.dodaj_zajecia(z)
        wyniki = self.kalendarz.szukaj("notatki")
        self.assertEqual(len(wyniki), 1)

    def test_szukaj_brak(self):
        z = self._przykladowe()
        self.kalendarz.dodaj_zajecia(z)
        wyniki = self.kalendarz.szukaj("Brak")
        self.assertEqual(len(wyniki), 0)


if __name__ == "__main__":
    unittest.main()

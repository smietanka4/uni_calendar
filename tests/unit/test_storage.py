"""
Testy jednostkowe dla modułu storage.
"""

import sys
import os
import unittest
import tempfile
import json
from datetime import date
from unittest.mock import patch

# Dodaj src/ do ścieżki
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "src"))

from event import Zajecia
import storage


class TestStorage(unittest.TestCase):

    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.temp_plik = os.path.join(self.temp_dir.name, "zajecia.json")
        
        self.patcher_dir = patch("storage._DATA_DIR", self.temp_dir.name)
        self.patcher_plik = patch("storage._PLIK", self.temp_plik)
        self.patcher_dir.start()
        self.patcher_plik.start()

    def tearDown(self):
        self.patcher_dir.stop()
        self.patcher_plik.stop()
        self.temp_dir.cleanup()

    def _przykladowe(self, id="123") -> Zajecia:
        return Zajecia(
            nazwa="Test",
            typ="Laboratorium",
            dzien_tygodnia=1,
            godzina_start="14:00",
            czas_trwania_min=90,
            data_od=date(2026, 4, 1),
            data_do=date(2026, 6, 30),
            sala="3.13",
            prowadzacy="Jan",
            notatki="Brak",
            id=id
        )

    def test_wczytaj_brak_pliku(self):
        wynik = storage.wczytaj()
        self.assertEqual(wynik, [])

    def test_zapisz_tworzy_plik(self):
        z = self._przykladowe()
        storage.zapisz([z])
        self.assertTrue(os.path.exists(self.temp_plik))

    def test_roundtrip_zapisz_wczytaj(self):
        z = self._przykladowe(id="abc")
        storage.zapisz([z])
        wczytane = storage.wczytaj()
        self.assertEqual(len(wczytane), 1)
        self.assertEqual(wczytane[0].id, "abc")
        self.assertEqual(wczytane[0].nazwa, "Test")

    def test_wczytaj_zepsuty_json(self):
        with open(self.temp_plik, "w", encoding="utf-8") as f:
            f.write("{ zepsuty json")
        wynik = storage.wczytaj()
        self.assertEqual(wynik, [])

    def test_wczytaj_zly_format(self):
        with open(self.temp_plik, "w", encoding="utf-8") as f:
            json.dump([{"zly": "klucz"}], f)
        wynik = storage.wczytaj()
        self.assertEqual(wynik, [])

    def test_wczytaj_istniejacy(self):
        z = self._przykladowe(id="def")
        with open(self.temp_plik, "w", encoding="utf-8") as f:
            json.dump([z.to_dict()], f)
        
        wynik = storage.wczytaj()
        self.assertEqual(len(wynik), 1)
        self.assertEqual(wynik[0].id, "def")


if __name__ == "__main__":
    unittest.main()

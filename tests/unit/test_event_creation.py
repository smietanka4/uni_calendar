"""
Testy jednostkowe dla klasy Zajecia.
Uruchomienie: python -m pytest tests/ -v  (z katalogu głównego projektu)
"""

import sys
import os
import unittest
from datetime import date

# Dodaj src/ do ścieżki
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "src"))

from event import Zajecia


class TestTworzenieZajec(unittest.TestCase):

    def _przykladowe(self) -> Zajecia:
        return Zajecia(
            nazwa="Programowanie w języku Golang",
            typ="Laboratorium",
            dzien_tygodnia=1,           # wtorek
            godzina_start="14:00",
            czas_trwania_min=90,
            data_od=date(2026, 4, 16),  # czwartek → pierwsza wt. to 21.04
            data_do=date(2026, 6, 30),
            sala="3.13",
            prowadzacy="dr inż. Jan Tuziemski",
            notatki="Patrz uwagi",
        )

    # ── Tworzenie ────────────────────────────────────────────────────

    def test_pola_podstawowe(self):
        z = self._przykladowe()
        self.assertEqual(z.nazwa, "Programowanie w języku Golang")
        self.assertEqual(z.typ, "Laboratorium")
        self.assertEqual(z.dzien_tygodnia, 1)
        self.assertEqual(z.godzina_start, "14:00")
        self.assertEqual(z.czas_trwania_min, 90)
        self.assertEqual(z.sala, "3.13")
        self.assertEqual(z.prowadzacy, "dr inż. Jan Tuziemski")
        self.assertEqual(z.notatki, "Patrz uwagi")

    def test_id_jest_generowane(self):
        z = self._przykladowe()
        self.assertIsNotNone(z.id)
        self.assertGreater(len(z.id), 0)

    def test_id_mozna_podac(self):
        z = Zajecia(
            nazwa="Test", typ="Wykład", dzien_tygodnia=0,
            godzina_start="10:00", czas_trwania_min=60,
            data_od=date(2026, 4, 1), data_do=date(2026, 6, 30),
            sala="1.01", prowadzacy="Jan Kowalski", id="abc123",
        )
        self.assertEqual(z.id, "abc123")

    # ── Godzina końca ────────────────────────────────────────────────

    def test_godzina_koniec(self):
        z = self._przykladowe()
        self.assertEqual(z.godzina_koniec(), "15:30")

    def test_godzina_koniec_przekroczona_godzina(self):
        z = Zajecia(
            nazwa="X", typ="X", dzien_tygodnia=0,
            godzina_start="23:00", czas_trwania_min=90,
            data_od=date(2026, 1, 1), data_do=date(2026, 1, 1),
            sala="A", prowadzacy="X",
        )
        self.assertEqual(z.godzina_koniec(), "00:30")

    # ── Daty wystąpień ───────────────────────────────────────────────

    def test_daty_wystapien_wtorek(self):
        z = self._przykladowe()
        daty = z.get_daty_wystapien()
        # Wszystkie daty muszą być wtorek (weekday == 1)
        for d in daty:
            self.assertEqual(d.weekday(), 1)

    def test_daty_wystapien_mieszcza_sie_w_zakresie(self):
        z = self._przykladowe()
        daty = z.get_daty_wystapien()
        for d in daty:
            self.assertGreaterEqual(d, z.data_od)
            self.assertLessEqual(d, z.data_do)

    def test_daty_wystapien_co_7_dni(self):
        z = self._przykladowe()
        daty = z.get_daty_wystapien()
        self.assertGreater(len(daty), 1)
        for i in range(1, len(daty)):
            self.assertEqual((daty[i] - daty[i - 1]).days, 7)

    def test_daty_wystapien_krotki_zakres(self):
        """Zakres dokładnie jednego tygodnia."""
        z = Zajecia(
            nazwa="X", typ="X", dzien_tygodnia=2,  # środa
            godzina_start="10:00", czas_trwania_min=60,
            data_od=date(2026, 4, 15),  # środa
            data_do=date(2026, 4, 15),  # tylko ten jeden dzień
            sala="A", prowadzacy="X",
        )
        daty = z.get_daty_wystapien()
        self.assertEqual(len(daty), 1)
        self.assertEqual(daty[0], date(2026, 4, 15))

    def test_daty_wystapien_pusty_gdy_dzien_poza_zakresem(self):
        """Data od i do to poniedziałek, ale szukamy wtorku."""
        z = Zajecia(
            nazwa="X", typ="X", dzien_tygodnia=1,  # wtorek
            godzina_start="10:00", czas_trwania_min=60,
            data_od=date(2026, 4, 20),  # poniedziałek
            data_do=date(2026, 4, 20),  # tylko poniedziałek
            sala="A", prowadzacy="X",
        )
        daty = z.get_daty_wystapien()
        self.assertEqual(len(daty), 0)

    # ── Serializacja ─────────────────────────────────────────────────

    def test_to_dict_zawiera_wszystkie_klucze(self):
        z = self._przykladowe()
        d = z.to_dict()
        for klucz in ("id", "nazwa", "typ", "dzien_tygodnia", "godzina_start",
                       "czas_trwania_min", "data_od", "data_do", "sala",
                       "prowadzacy", "notatki"):
            self.assertIn(klucz, d)

    def test_roundtrip_from_dict(self):
        z = self._przykladowe()
        z2 = Zajecia.from_dict(z.to_dict())
        self.assertEqual(z.id, z2.id)
        self.assertEqual(z.nazwa, z2.nazwa)
        self.assertEqual(z.typ, z2.typ)
        self.assertEqual(z.dzien_tygodnia, z2.dzien_tygodnia)
        self.assertEqual(z.godzina_start, z2.godzina_start)
        self.assertEqual(z.czas_trwania_min, z2.czas_trwania_min)
        self.assertEqual(z.data_od, z2.data_od)
        self.assertEqual(z.data_do, z2.data_do)
        self.assertEqual(z.sala, z2.sala)
        self.assertEqual(z.prowadzacy, z2.prowadzacy)
        self.assertEqual(z.notatki, z2.notatki)


if __name__ == "__main__":
    unittest.main()

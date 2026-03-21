"""
Moduł: storage.py
Odpowiada za zapis i odczyt danych zajęć z pliku JSON.
Plik danych: data/zajecia.json (względem katalogu src/)
"""

from __future__ import annotations
import json
import os
from event import Zajecia

# Ścieżka do pliku danych – obok katalogu src/ (czyli w katalogu projektu)
_BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_DATA_DIR = os.path.join(_BASE_DIR, "data")
_PLIK = os.path.join(_DATA_DIR, "zajecia.json")


def _zapewnij_katalog() -> None:
    os.makedirs(_DATA_DIR, exist_ok=True)


def wczytaj() -> list[Zajecia]:
    """Wczytuje listę zajęć z pliku JSON. Zwraca pustą listę gdy brak pliku."""
    _zapewnij_katalog()
    if not os.path.exists(_PLIK):
        return []
    try:
        with open(_PLIK, encoding="utf-8") as f:
            dane = json.load(f)
        return [Zajecia.from_dict(d) for d in dane]
    except (json.JSONDecodeError, KeyError):
        print("[!] Błąd odczytu pliku danych – plik mógł być uszkodzony.")
        return []


def zapisz(lista: list[Zajecia]) -> None:
    """Zapisuje listę zajęć do pliku JSON."""
    _zapewnij_katalog()
    with open(_PLIK, "w", encoding="utf-8") as f:
        json.dump([z.to_dict() for z in lista], f, ensure_ascii=False, indent=2)

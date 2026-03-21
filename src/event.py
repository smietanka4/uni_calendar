"""
Moduł: event.py
Definiuje klasę Zajecia reprezentującą pojedyncze zajęcia akademickie
z obsługą cykliczności (co tydzień, w podanym przedziale dat).
"""

from __future__ import annotations
import uuid
from datetime import date, timedelta


TYPY_ZAJEC = ["Wykład", "Laboratorium", "Ćwiczenia", "Seminarium", "Projekt", "Inne"]

DNI_TYGODNIA = [
    "Poniedziałek",
    "Wtorek",
    "Środa",
    "Czwartek",
    "Piątek",
    "Sobota",
    "Niedziela",
]


class Zajecia:
    """Reprezentuje cykliczne zajęcia akademickie."""

    def __init__(
        self,
        nazwa: str,
        typ: str,
        dzien_tygodnia: int,
        godzina_start: str,
        czas_trwania_min: int,
        data_od: date,
        data_do: date,
        sala: str,
        prowadzacy: str,
        notatki: str = "",
        id: str | None = None,
    ) -> None:
        self.id: str = id or str(uuid.uuid4())[:8]
        self.nazwa = nazwa
        self.typ = typ
        self.dzien_tygodnia = dzien_tygodnia   # 0 = pon, 6 = nd
        self.godzina_start = godzina_start      # "HH:MM"
        self.czas_trwania_min = czas_trwania_min
        self.data_od = data_od
        self.data_do = data_do
        self.sala = sala
        self.prowadzacy = prowadzacy
        self.notatki = notatki

    # ------------------------------------------------------------------
    # Daty wystąpień
    # ------------------------------------------------------------------

    def get_daty_wystapien(self) -> list[date]:
        """Zwraca listę dat (co tydzień) mieszczących się w przedziale."""
        wyniki: list[date] = []
        # Znajdź pierwszą datę >= data_od o właściwym dniu tygodnia
        delta = (self.dzien_tygodnia - self.data_od.weekday()) % 7
        biezaca = self.data_od + timedelta(days=delta)
        while biezaca <= self.data_do:
            wyniki.append(biezaca)
            biezaca += timedelta(weeks=1)
        return wyniki

    def godzina_koniec(self) -> str:
        """Oblicza godzinę zakończenia zajęć."""
        h, m = map(int, self.godzina_start.split(":"))
        total = h * 60 + m + self.czas_trwania_min
        return f"{(total // 60) % 24:02d}:{total % 60:02d}"

    def nazwadzien(self) -> str:
        return DNI_TYGODNIA[self.dzien_tygodnia]

    # ------------------------------------------------------------------
    # Serializacja JSON
    # ------------------------------------------------------------------

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "nazwa": self.nazwa,
            "typ": self.typ,
            "dzien_tygodnia": self.dzien_tygodnia,
            "godzina_start": self.godzina_start,
            "czas_trwania_min": self.czas_trwania_min,
            "data_od": self.data_od.isoformat(),
            "data_do": self.data_do.isoformat(),
            "sala": self.sala,
            "prowadzacy": self.prowadzacy,
            "notatki": self.notatki,
        }

    @classmethod
    def from_dict(cls, d: dict) -> "Zajecia":
        return cls(
            id=d["id"],
            nazwa=d["nazwa"],
            typ=d["typ"],
            dzien_tygodnia=d["dzien_tygodnia"],
            godzina_start=d["godzina_start"],
            czas_trwania_min=d["czas_trwania_min"],
            data_od=date.fromisoformat(d["data_od"]),
            data_do=date.fromisoformat(d["data_do"]),
            sala=d["sala"],
            prowadzacy=d["prowadzacy"],
            notatki=d.get("notatki", ""),
        )

    def __repr__(self) -> str:
        return (
            f"Zajecia(id={self.id!r}, nazwa={self.nazwa!r}, "
            f"dzien={self.nazwadzien()}, godz={self.godzina_start})"
        )

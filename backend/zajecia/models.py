from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

TYPY_ZAJEC = [
    ("WYK", "Wykład"),
    ("LAB", "Laboratorium"),
    ("CWI", "Ćwiczenia"),
    ("SEM", "Seminarium"),
    ("PRO", "Projekt"),
    ("INN", "Inne"),
]

DNI_TYGODNIA = [
    (0, "Poniedziałek"),
    (1, "Wtorek"),
    (2, "Środa"),
    (3, "Czwartek"),
    (4, "Piątek"),
    (5, "Sobota"),
    (6, "Niedziela"),
]


class Zajecia(models.Model):
    uzytkownik = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="zajecia"
    )
    nazwa = models.CharField(max_length=200)
    typ = models.CharField(max_length=3, choices=TYPY_ZAJEC, default="WYK")
    dzien_tygodnia = models.IntegerField(choices=DNI_TYGODNIA)
    godzina_start = models.TimeField()
    czas_trwania_min = models.PositiveIntegerField()
    data_od = models.DateField()
    data_do = models.DateField()
    sala = models.CharField(max_length=50, blank=True, default="")
    prowadzacy = models.CharField(max_length=200, blank=True, default="")
    notatki = models.TextField(blank=True, default="")
    utworzone = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["dzien_tygodnia", "godzina_start"]
        verbose_name = "Zajęcia"
        verbose_name_plural = "Zajęcia"

    def __str__(self):
        return f"{self.nazwa} ({self.get_dzien_tygodnia_display()}, {self.godzina_start})"

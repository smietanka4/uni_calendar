import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Kalendarz(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nazwa = models.CharField(max_length=200)
    wlasciciel = models.ForeignKey(User, on_delete=models.CASCADE, related_name='moje_kalendarze')
    haslo = models.CharField(max_length=128, blank=True)
    subskrybenci = models.ManyToManyField(User, related_name='subskrybowane_kalendarze', blank=True)

    def __str__(self):
        return f"{self.nazwa} ({self.wlasciciel})"


class Zajecia(models.Model):
    TYPY_ZAJEC = [
        ('WYK', 'Wykład'),
        ('LAB', 'Laboratorium'),
        ('CWI', 'Ćwiczenia'),
        ('SEM', 'Seminarium'),
        ('PRO', 'Projekt'),
        ('INN', 'Inne'),
    ]

    DNI_TYGODNIA = [
        (0, 'Poniedziałek'),
        (1, 'Wtorek'),
        (2, 'Środa'),
        (3, 'Czwartek'),
        (4, 'Piątek'),
        (5, 'Sobota'),
        (6, 'Niedziela'),
    ]

    kalendarz = models.ForeignKey(Kalendarz, on_delete=models.CASCADE, related_name='zajecia')
    nazwa = models.CharField(max_length=200)
    typ = models.CharField(max_length=3, choices=TYPY_ZAJEC, default='WYK')
    dzien_tygodnia = models.IntegerField(choices=DNI_TYGODNIA)
    godzina_start = models.TimeField()
    czas_trwania_min = models.IntegerField(default=90)
    data_od = models.DateField()
    data_do = models.DateField()

    sala = models.CharField(max_length=50, blank=True)
    prowadzacy = models.CharField(max_length=100, blank=True)
    notatki = models.TextField(blank=True)

    class Meta:
        ordering = ['dzien_tygodnia', 'godzina_start']
        verbose_name = 'Zajęcia'
        verbose_name_plural = 'Zajęcia'

    def __str__(self):
        return f"{self.nazwa} ({self.get_typ_display()})"

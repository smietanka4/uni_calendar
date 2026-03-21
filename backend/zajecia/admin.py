from django.contrib import admin
from .models import Zajecia


@admin.register(Zajecia)
class ZajeciaAdmin(admin.ModelAdmin):
    list_display = [
        "nazwa", "typ", "get_dzien_tygodnia_display",
        "godzina_start", "sala", "prowadzacy", "uzytkownik"
    ]
    list_filter = ["typ", "dzien_tygodnia", "uzytkownik"]
    search_fields = ["nazwa", "prowadzacy", "sala"]
    ordering = ["dzien_tygodnia", "godzina_start"]

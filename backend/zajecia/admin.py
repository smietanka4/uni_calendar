from django.contrib import admin
from .models import Zajecia, Kalendarz

@admin.register(Kalendarz)
class KalendarzAdmin(admin.ModelAdmin):
    list_display = ('nazwa', 'wlasciciel')
    search_fields = ('nazwa', 'wlasciciel__username')
    filter_horizontal = ('subskrybenci',)

@admin.register(Zajecia)
class ZajeciaAdmin(admin.ModelAdmin):
    list_display = [
        "nazwa", "typ", "get_dzien_tygodnia_display",
        "godzina_start", "sala", "prowadzacy", "kalendarz"
    ]
    list_filter = ["typ", "dzien_tygodnia", "kalendarz"]
    search_fields = ["nazwa", "prowadzacy", "sala"]
    ordering = ["dzien_tygodnia", "godzina_start"]

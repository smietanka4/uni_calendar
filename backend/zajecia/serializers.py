from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Zajecia

User = get_user_model()


class ZajeciaSerializer(serializers.ModelSerializer):
    typ_display = serializers.CharField(source="get_typ_display", read_only=True)
    dzien_display = serializers.CharField(
        source="get_dzien_tygodnia_display", read_only=True
    )
    godzina_koniec = serializers.SerializerMethodField()

    class Meta:
        model = Zajecia
        fields = [
            "id",
            "nazwa",
            "typ",
            "typ_display",
            "dzien_tygodnia",
            "dzien_display",
            "godzina_start",
            "godzina_koniec",
            "czas_trwania_min",
            "data_od",
            "data_do",
            "sala",
            "prowadzacy",
            "notatki",
            "utworzone",
        ]
        read_only_fields = ["id", "utworzone"]

    def get_godzina_koniec(self, obj):
        from datetime import datetime, timedelta
        dt = datetime.combine(datetime.today(), obj.godzina_start)
        dt_end = dt + timedelta(minutes=obj.czas_trwania_min)
        return dt_end.strftime("%H:%M")


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    password2 = serializers.CharField(write_only=True, label="Potwierdź hasło")

    class Meta:
        model = User
        fields = ["username", "email", "password", "password2"]

    def validate(self, data):
        if data["password"] != data["password2"]:
            raise serializers.ValidationError({"password2": "Hasła nie są identyczne."})
        return data

    def create(self, validated_data):
        validated_data.pop("password2")
        user = User.objects.create_user(**validated_data)
        return user

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from datetime import timedelta, datetime
from .models import Zajecia, Kalendarz

User = get_user_model()

class KalendarzSerializer(serializers.ModelSerializer):
    czy_wlasciciel = serializers.SerializerMethodField()
    jest_subskrybentem = serializers.SerializerMethodField()
    wlasciciel_nazwa = serializers.CharField(source='wlasciciel.username', read_only=True)
    
    class Meta:
        model = Kalendarz
        fields = ['id', 'nazwa', 'wlasciciel', 'wlasciciel_nazwa', 'haslo', 'czy_wlasciciel', 'jest_subskrybentem']
        extra_kwargs = {
            'haslo': {'write_only': True, 'required': False},
            'wlasciciel': {'read_only': True}
        }

    def get_czy_wlasciciel(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.wlasciciel == request.user
        return False
        
    def get_jest_subskrybentem(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.subskrybenci.filter(id=request.user.id).exists()
        return False


class ZajeciaSerializer(serializers.ModelSerializer):
    typ_display = serializers.CharField(source='get_typ_display', read_only=True)
    godzina_koniec = serializers.SerializerMethodField()
    czy_wlasciciel = serializers.SerializerMethodField()
    kalendarz_nazwa = serializers.CharField(source='kalendarz.nazwa', read_only=True)

    class Meta:
        model = Zajecia
        fields = '__all__'
        read_only_fields = ['kalendarz']

    def get_godzina_koniec(self, obj):
        start_datetime = datetime.combine(datetime.today(), obj.godzina_start)
        end_datetime = start_datetime + timedelta(minutes=obj.czas_trwania_min)
        return end_datetime.time().strftime("%H:%M")

    def get_czy_wlasciciel(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.kalendarz.wlasciciel == request.user
        return False


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password_confirm')

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({"password": "Hasła nie są identyczne."})
        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user

from datetime import date, timedelta
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Zajecia, Kalendarz
from .serializers import ZajeciaSerializer, KalendarzSerializer

class KalendarzViewSet(viewsets.ModelViewSet):
    serializer_class = KalendarzSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return Kalendarz.objects.filter(Q(wlasciciel=user) | Q(subskrybenci=user)).distinct()

    def perform_create(self, serializer):
        serializer.save(wlasciciel=self.request.user)

    @action(detail=False, methods=['post'], url_path='join')
    def join(self, request):
        kalendarz_id = request.data.get('id')
        haslo = request.data.get('haslo', '')
        
        if not kalendarz_id:
            return Response({'error': 'Podaj ID kalendarza.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            kalendarz = Kalendarz.objects.get(id=kalendarz_id)
            if kalendarz.haslo and kalendarz.haslo != haslo:
                return Response({'error': 'Nieprawidłowe hasło.'}, status=status.HTTP_403_FORBIDDEN)
            
            if kalendarz.wlasciciel == request.user:
                return Response({'error': 'Jesteś właścicielem tego kalendarza.'}, status=status.HTTP_400_BAD_REQUEST)
                
            kalendarz.subskrybenci.add(request.user)
            return Response({'message': 'Dołączono do kalendarza.'}, status=status.HTTP_200_OK)
            
        except Kalendarz.DoesNotExist:
            return Response({'error': 'Kalendarz nie istnieje.'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'], url_path='leave')
    def leave(self, request, pk=None):
        kalendarz = self.get_object()
        if kalendarz.wlasciciel == request.user:
            return Response({'error': 'Nie możesz opuścić powiązanego własnego kalendarza.'}, status=status.HTTP_400_BAD_REQUEST)
        kalendarz.subskrybenci.remove(request.user)
        return Response({'message': 'Opuszczono kalendarz.'}, status=status.HTTP_200_OK)


class IsZajeciaOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.kalendarz.wlasciciel == request.user

class ZajeciaViewSet(viewsets.ModelViewSet):
    serializer_class = ZajeciaSerializer
    permission_classes = [permissions.IsAuthenticated, IsZajeciaOwnerOrReadOnly]
    http_method_names = ["get", "post", "put", "patch", "delete", "head", "options"]

    def get_queryset(self):
        user = self.request.user
        qs = Zajecia.objects.filter(Q(kalendarz__wlasciciel=user) | Q(kalendarz__subskrybenci=user)).distinct()
        
        kalendarz_id = self.request.query_params.get("kalendarz")
        if kalendarz_id:
            qs = qs.filter(kalendarz_id=kalendarz_id)
            
        q = self.request.query_params.get("q")
        if q:
            qs = (qs.filter(nazwa__icontains=q) | 
                  qs.filter(prowadzacy__icontains=q) | 
                  qs.filter(sala__icontains=q) | 
                  qs.filter(notatki__icontains=q)).distinct()
        return qs

    def perform_create(self, serializer):
        kalendarz = serializer.validated_data.get('kalendarz')
        if kalendarz.wlasciciel != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Możesz dodawać zajęcia tylko do kalendarza, którego jesteś właścicielem.")
        serializer.save()

    @action(detail=False, methods=["get"], url_path="tydzien")
    def tydzien(self, request):
        data_str = request.query_params.get("data")
        try:
            wybrana = date.fromisoformat(data_str) if data_str else date.today()
        except ValueError:
            return Response({"error": "Nieprawidłowy format daty. Użyj YYYY-MM-DD."}, status=status.HTTP_400_BAD_REQUEST)

        poniedzialek = wybrana - timedelta(days=wybrana.weekday())
        niedziela = poniedzialek + timedelta(days=6)

        user = request.user
        zajecia = Zajecia.objects.filter(Q(kalendarz__wlasciciel=user) | Q(kalendarz__subskrybenci=user)).distinct()
        
        kalendarz_id = request.query_params.get("kalendarz")
        if kalendarz_id:
            zajecia = zajecia.filter(kalendarz_id=kalendarz_id)

        wyniki = []
        for z in zajecia:
            delta = (z.dzien_tygodnia - z.data_od.weekday()) % 7
            biezaca = z.data_od + timedelta(days=delta)
            while biezaca <= z.data_do:
                if poniedzialek <= biezaca <= niedziela:
                    serialized = ZajeciaSerializer(z, context={'request': request}).data
                    serialized["data_wystapienia"] = biezaca.isoformat()
                    wyniki.append(serialized)
                    break
                biezaca += timedelta(weeks=1)

        wyniki.sort(key=lambda x: (x["data_wystapienia"], x["godzina_start"]))
        return Response(wyniki)

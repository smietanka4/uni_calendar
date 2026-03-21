from datetime import date, timedelta
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Zajecia
from .serializers import ZajeciaSerializer


class ZajeciaViewSet(viewsets.ModelViewSet):
    """
    CRUD dla zajęć zalogowanego użytkownika.
    Obsługuje: list, create, retrieve, destroy.
    Edycja (update/partial_update) jest wyłączona.
    """

    serializer_class = ZajeciaSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "delete", "head", "options"]

    def get_queryset(self):
        qs = Zajecia.objects.filter(uzytkownik=self.request.user)
        q = self.request.query_params.get("q")
        if q:
            qs = qs.filter(
                nazwa__icontains=q
            ) | qs.filter(
                prowadzacy__icontains=q
            ) | qs.filter(
                sala__icontains=q
            ) | qs.filter(
                notatki__icontains=q
            )
            qs = qs.filter(uzytkownik=self.request.user).distinct()
        return qs

    def perform_create(self, serializer):
        serializer.save(uzytkownik=self.request.user)

    @action(detail=False, methods=["get"], url_path="tydzien")
    def tydzien(self, request):
        """
        GET /api/zajecia/tydzien/?data=YYYY-MM-DD
        Zwraca wystąpienia zajęć dla tygodnia zawierającego podaną datę.
        """
        data_str = request.query_params.get("data")
        try:
            if data_str:
                wybrana = date.fromisoformat(data_str)
            else:
                wybrana = date.today()
        except ValueError:
            return Response(
                {"error": "Nieprawidłowy format daty. Użyj YYYY-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        poniedzialek = wybrana - timedelta(days=wybrana.weekday())
        niedziela = poniedzialek + timedelta(days=6)

        zajecia = Zajecia.objects.filter(uzytkownik=request.user)

        wyniki = []
        for z in zajecia:
            # Generuj daty wystąpień (logika jak w konsoli)
            delta = (z.dzien_tygodnia - z.data_od.weekday()) % 7
            biezaca = z.data_od + timedelta(days=delta)
            while biezaca <= z.data_do:
                if poniedzialek <= biezaca <= niedziela:
                    serialized = ZajeciaSerializer(z).data
                    serialized["data_wystapienia"] = biezaca.isoformat()
                    wyniki.append(serialized)
                    break
                biezaca += timedelta(weeks=1)

        wyniki.sort(key=lambda x: (x["data_wystapienia"], x["godzina_start"]))
        return Response(wyniki)

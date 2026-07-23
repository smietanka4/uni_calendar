from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth.password_validation import validate_password
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.exceptions import ValidationError
from decouple import config
from .serializers import RegisterSerializer

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/ — rejestracja nowego użytkownika."""
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Automatycznie zwróć tokeny po rejestracji
        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                },
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(generics.GenericAPIView):
    """POST /api/auth/login/ — logowanie, zwraca JWT."""
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username", "").strip()
        password = request.data.get("password", "")

        if not username or not password:
            return Response(
                {"error": "Podaj login i hasło."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(request, username=username, password=password)

        if user is None:
            return Response(
                {"error": "Nieprawidłowy login lub hasło."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "is_staff": user.is_staff,
                },
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            }
        )


class PasswordResetRequestView(generics.GenericAPIView):
    """POST /api/auth/password_reset/ — wysyła email z linkiem resetującym."""
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "").strip()
        if not email:
            return Response(
                {"error": "Podaj adres e-mail."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Zawsze zwracamy sukces, żeby nie ujawniać czy konto istnieje
        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response(
                {"message": "Jeśli konto z tym e-mailem istnieje, wysłaliśmy instrukcje resetowania hasła."},
                status=status.HTTP_200_OK,
            )

        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = default_token_generator.make_token(user)

        # Frontend URL – pobieramy z env lub domyślnie localhost
        frontend_url = config("FRONTEND_URL", default="http://localhost:5173")
        reset_link = f"{frontend_url}/reset-hasla/{uid}/{token}"

        send_mail(
            subject="[Uni Calendar] Reset Hasła",
            message=(
                f"Cześć {user.username},\n\n"
                f"Kliknij w poniższy link, aby zresetować hasło do swojego konta Uni Calendar:\n\n"
                f"{reset_link}\n\n"
                f"Link jest ważny przez 24 godziny.\n\n"
                f"Jeśli to nie Ty prosiłeś o reset, zignoruj tę wiadomość.\n\n"
                f"-- Uni Calendar"
            ),
            from_email=None,  # używa DEFAULT_FROM_EMAIL z settings
            recipient_list=[user.email],
            fail_silently=False,
        )

        return Response(
            {"message": "Jeśli konto z tym e-mailem istnieje, wysłaliśmy instrukcje resetowania hasła."},
            status=status.HTTP_200_OK,
        )


class PasswordResetConfirmView(generics.GenericAPIView):
    """POST /api/auth/password_reset_confirm/ — ustawia nowe hasło."""
    permission_classes = [AllowAny]

    def post(self, request):
        uid = request.data.get("uid", "")
        token = request.data.get("token", "")
        password = request.data.get("password", "")
        password_confirm = request.data.get("password_confirm", "")

        if not all([uid, token, password, password_confirm]):
            return Response(
                {"error": "Wszystkie pola są wymagane."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if password != password_confirm:
            return Response(
                {"error": "Hasła nie są identyczne."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Dekoduj uid
        try:
            user_pk = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_pk)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {"error": "Nieprawidłowy lub przeterminowany link resetujący."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Sprawdź token
        if not default_token_generator.check_token(user, token):
            return Response(
                {"error": "Nieprawidłowy lub przeterminowany token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Walidacja hasła przez Django validators
        try:
            validate_password(password, user)
        except ValidationError as e:
            return Response(
                {"error": " ".join(e.messages)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(password)
        user.save()

        return Response(
            {"message": "Hasło zostało pomyślnie zmienione. Możesz się teraz zalogować."},
            status=status.HTTP_200_OK,
        )

from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from zajecia.auth_views import RegisterView, LoginView

urlpatterns = [
    # Django admin
    path("django-admin/", admin.site.urls),
    # Auth
    path("api/auth/register/", RegisterView.as_view(), name="register"),
    path("api/auth/login/", LoginView.as_view(), name="login"),
    path("api/auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # path("api/auth/password_reset/", PasswordResetRequestView.as_view(), name="password_reset"),
    # path("api/auth/password_reset_confirm/", PasswordResetConfirmView.as_view(), name="password_reset_confirm"),
    # Zajecia API
    path("api/", include("zajecia.urls")),
]

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ZajeciaViewSet, KalendarzViewSet
from .auth_views import RegisterView, LoginView
from rest_framework_simplejwt.views import TokenRefreshView

router = DefaultRouter()
router.register(r'kalendarze', KalendarzViewSet, basename='kalendarze')
router.register(r'zajecia', ZajeciaViewSet, basename='zajecia')

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('', include(router.urls)),
]

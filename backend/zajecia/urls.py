from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ZajeciaViewSet

router = DefaultRouter()
router.register(r"zajecia", ZajeciaViewSet, basename="zajecia")

urlpatterns = [
    path("", include(router.urls)),
]

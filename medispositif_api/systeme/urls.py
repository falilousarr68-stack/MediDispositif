from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ParametreSystemeViewSet, RapportViewSet, JournalAuditViewSet

router = DefaultRouter()
router.register('parametres', ParametreSystemeViewSet, basename='parametre')
router.register('rapports', RapportViewSet, basename='rapport')
router.register('audit',JournalAuditViewSet,basename='audit')

app_name = 'systeme'

urlpatterns = [
    path('', include(router.urls)),
]

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CommandeViewSet, FactureViewSet, LigneCommandeViewSet, PaiementViewSet

router = DefaultRouter()
router.register('commandes', CommandeViewSet, basename='commande')
router.register('lignes-commande', LigneCommandeViewSet, basename='ligne-commande')
router.register('paiements', PaiementViewSet, basename='paiement')
router.register('factures', FactureViewSet, basename='facture')

app_name = 'ventes'

urlpatterns = [
    path('', include(router.urls)),
]

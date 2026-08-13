from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ApprovisionnementViewSet,
    CatalogueViewSet,
    DetailsApprovisionnementViewSet,
    ProduitMedicalViewSet,
    StatistiquesProduitsView,
)

router = DefaultRouter()
router.register('catalogues', CatalogueViewSet, basename='catalogue')
router.register('produits', ProduitMedicalViewSet, basename='produit')
router.register('approvisionnements', ApprovisionnementViewSet, basename='approvisionnement')
router.register('details-approvisionnement', DetailsApprovisionnementViewSet, basename='detail-approvisionnement')

app_name = 'catalogue'

urlpatterns = [
    path('', include(router.urls)),
    path('statistiques/produits/', StatistiquesProduitsView.as_view(), name='statistiques-produits'),
]

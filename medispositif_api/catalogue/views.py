from django.db.models import Q
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Approvisionnement, Catalogue, DetailsApprovisionnement, ProduitMedical
from .permissions import EstGestionnaireStock, LecturePubliqueEcritureGestionnaire
from .serializers import (
    ApprovisionnementCreateSerializer,
    ApprovisionnementSerializer,
    CatalogueSerializer,
    DetailsApprovisionnementSerializer,
    ProduitMedicalListSerializer,
    ProduitMedicalSerializer,
)


class CatalogueViewSet(viewsets.ModelViewSet):
    """CRUD des catalogues — réservé au Gestionnaire de Stock."""

    queryset = Catalogue.objects.all()
    serializer_class = CatalogueSerializer
    permission_classes = [EstGestionnaireStock]


class ProduitMedicalViewSet(viewsets.ModelViewSet):
    """
    Gestion des produits médicaux.
    GET public (recherche par nom, catalogue, prix).
    POST/PUT/DELETE réservés au Gestionnaire de Stock.
    """

    queryset = ProduitMedical.objects.select_related('catalogue').all()
    permission_classes = [LecturePubliqueEcritureGestionnaire]

    def get_serializer_class(self):
        if self.action in ('list', 'retrieve'):
            return ProduitMedicalListSerializer
        return ProduitMedicalSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        nom = self.request.query_params.get('nom')
        catalogue = self.request.query_params.get('catalogue')
        prix_min = self.request.query_params.get('prix_min')
        prix_max = self.request.query_params.get('prix_max')

        if nom:
            queryset = queryset.filter(nom__icontains=nom)
        if catalogue:
            queryset = queryset.filter(
                Q(catalogue__nom__icontains=catalogue) | Q(catalogue_id=catalogue)
            )
        if prix_min:
            queryset = queryset.filter(prix__gte=prix_min)
        if prix_max:
            queryset = queryset.filter(prix__lte=prix_max)

        return queryset


class ApprovisionnementViewSet(viewsets.ModelViewSet):
    """CRUD des approvisionnements — réservé au Gestionnaire de Stock."""

    queryset = Approvisionnement.objects.prefetch_related('details__produit').all()
    permission_classes = [EstGestionnaireStock]

    def get_serializer_class(self):
        if self.action == 'create':
            return ApprovisionnementCreateSerializer
        return ApprovisionnementSerializer

    @action(detail=True, methods=['post'], url_path='ajouter-detail')
    def ajouter_detail(self, request, pk=None):
        """Ajoute un détail à un approvisionnement existant."""
        approvisionnement = self.get_object()
        serializer = DetailsApprovisionnementSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        detail = DetailsApprovisionnement.objects.create(
            approvisionnement=approvisionnement,
            **serializer.validated_data,
        )

        return Response(
            DetailsApprovisionnementSerializer(detail).data,
            status=201,
        )


class DetailsApprovisionnementViewSet(viewsets.ModelViewSet):
    """CRUD des détails d'approvisionnement — réservé au Gestionnaire de Stock."""

    queryset = DetailsApprovisionnement.objects.select_related('produit', 'approvisionnement').all()
    serializer_class = DetailsApprovisionnementSerializer
    permission_classes = [EstGestionnaireStock]

    def get_queryset(self):
        queryset = super().get_queryset()
        appro_id = self.request.query_params.get('approvisionnement')
        if appro_id:
            queryset = queryset.filter(approvisionnement_id=appro_id)
        return queryset

from django.db.models import Q, Sum
from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from authentication.permissions import EstAdministrateur
from ventes.models import Commande, LigneCommande, StatutCommande

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
from .serializers_stats import StatistiqueProduitSerializer


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


class StatistiquesProduitsView(generics.ListAPIView):
    """
    Endpoint pour les statistiques de produits commandés vs stock total.
    Réservé à l'administrateur pour le dashboard.
    """

    permission_classes = [IsAuthenticated, EstAdministrateur]
    serializer_class = StatistiqueProduitSerializer

    def get_queryset(self):
        """Calcule les statistiques pour chaque produit."""
        produits = ProduitMedical.objects.select_related('catalogue').all()

        statistiques = []
        for produit in produits:
            # Calculer la quantité totale commandée pour ce produit
            quantite_commandee = (
                LigneCommande.objects
                .filter(
                    produit=produit,
                    commande__statut=StatutCommande.VALIDEE
                )
                .aggregate(total=Sum('quantite'))['total'] or 0
            )

            # Stock total = stock actuel + quantité commandée (validée)
            stock_total = produit.stock + quantite_commandee

            # Calculer le pourcentage vendu
            pourcentage_vendu = 0
            if stock_total > 0:
                pourcentage_vendu = (quantite_commandee / stock_total) * 100

            statistiques.append({
                'idProduit': produit.idProduit,
                'nom': produit.nom,
                'catalogue': produit.catalogue.nom,
                'stock_actuel': produit.stock,
                'quantite_commandee': quantite_commandee,
                'stock_total': stock_total,
                'pourcentage_vendu': round(pourcentage_vendu, 2),
            })

        return statistiques

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(
            {
                'message': 'Statistiques des produits récupérées avec succès.',
                'statistiques': serializer.data,
                'total_produits': len(queryset),
            },
            status=status.HTTP_200_OK,
        )

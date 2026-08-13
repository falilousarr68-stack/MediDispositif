from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from authentication.models import Role
from .models import Commande, Facture, LigneCommande, Paiement, StatutCommande
from .permissions import (
    EstClientOuVendeurOuResponsable,
    EstProprietaireCommandeOuResponsable,
    EstProprietaireOuVendeurOuResponsable,
    EstResponsableCommercial,
    EstVendeurOuResponsable,
    PeutAnnulerCommande,
    PeutValiderCommande,
)
from .serializers import (
    CommandeCreateSerializer,
    CommandeDetailSerializer,
    CommandeListSerializer,
    CommandeValidationSerializer,
    FactureSerializer,
    LigneCommandeCreateSerializer,
    LigneCommandeSerializer,
    PaiementSerializer,
)


class CommandeViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des commandes.
    - Clients : peuvent créer leurs commandes et voir les leurs
    - Vendeurs : peuvent voir toutes les commandes
    - Responsable Commercial : full accès
    """

    def get_queryset(self):
        queryset = Commande.objects.select_related('client').prefetch_related('lignes__produit')

        user = self.request.user
        print(f"User authenticated: {user.is_authenticated}")
        print(f"User role: {user.role if user.is_authenticated else 'Anonymous'}")
        
        if not user.is_authenticated:
            return queryset.none()
        
        if user.role == Role.CLIENT:
            queryset = queryset.filter(client=user)
            print(f"Filtering for client: {user.email}")
        elif user.role == Role.VENDEUR:
            queryset = queryset.all()
            print("Showing all orders for Vendeur")
        elif user.role == Role.RESPONSABLE_COMMERCIAL:
            queryset = queryset.all()
            print("Showing all orders for Responsable Commercial")
        elif user.role == Role.ADMINISTRATEUR:
            queryset = queryset.all()
            print("Showing all orders for Administrateur")
        else:
            queryset = queryset.none()
            print(f"No orders for role: {user.role}")

        statut = self.request.query_params.get('statut')
        if statut:
            queryset = queryset.filter(statut=statut)

        print(f"Queryset count: {queryset.count()}")
        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return CommandeListSerializer
        elif self.action == 'create':
            return CommandeCreateSerializer
        return CommandeDetailSerializer

    def get_permissions(self):
        if self.action == 'create':
            permission_classes = [EstClientOuVendeurOuResponsable]
        elif self.action in ['update', 'partial_update']:
            permission_classes = [EstProprietaireOuVendeurOuResponsable]
        elif self.action == 'destroy':
            permission_classes = [EstResponsableCommercial]
        elif self.action == 'valider':
            permission_classes = [PeutValiderCommande]
        elif self.action == 'annuler':
            permission_classes = [PeutAnnulerCommande]
        elif self.action == 'list':
            permission_classes = [EstProprietaireOuVendeurOuResponsable]  # Admin can see all through queryset
        else:
            permission_classes = [EstProprietaireOuVendeurOuResponsable]
        return [permission() for permission in permission_classes]

    @action(detail=True, methods=['post'], url_path='valider')
    def valider(self, request, pk=None):
        """
        Valide une commande (décrémente le stock).
        Réservé au Responsable Commercial.
        """
        commande = self.get_object()
        try:
            commande.valider_commande()
            serializer = self.get_serializer(commande)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='annuler')
    def annuler(self, request, pk=None):
        """
        Annule une commande avec un motif obligatoire pour le Responsable Commercial.
        """
        commande = self.get_object()
        serializer = CommandeValidationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        motif = serializer.validated_data.get('motif', '')

        if request.user.role == Role.RESPONSABLE_COMMERCIAL and not motif:
            return Response(
                {'error': "Le motif d'annulation est obligatoire pour le Responsable Commercial."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            commande.annuler_commande(motif)
            serializer = self.get_serializer(commande)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class LigneCommandeViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des lignes de commande.
    - Lecture : autorisée pour le propriétaire, Vendeur et Responsable
    - Création/Mise à jour : réservée au propriétaire de la commande et au Responsable
    """

    serializer_class = LigneCommandeSerializer
    permission_classes = [EstProprietaireOuVendeurOuResponsable]

    def get_queryset(self):
        queryset = LigneCommande.objects.select_related('commande', 'produit')

        commande_id = self.request.query_params.get('commande')
        if commande_id:
            queryset = queryset.filter(commande_id=commande_id)

        user = self.request.user
        if user.role == Role.CLIENT:
            queryset = queryset.filter(commande__client=user)

        return queryset

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return LigneCommandeCreateSerializer
        return LigneCommandeSerializer


class PaiementViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des paiements.
    - Création : Vendeur et Responsable Commercial
    - Lecture : tous les utilisateurs authentifiés
    """

    serializer_class = PaiementSerializer
    permission_classes = [EstVendeurOuResponsable]

    def get_queryset(self):
        queryset = Paiement.objects.select_related('commande__client')

        commande_id = self.request.query_params.get('commande')
        if commande_id:
            queryset = queryset.filter(commande_id=commande_id)

        return queryset

    def get_permissions(self):
        if self.action == 'list':
            permission_classes = [EstClientOuVendeurOuResponsable]
        elif self.action == 'retrieve':
            permission_classes = [EstClientOuVendeurOuResponsable]
        else:
            permission_classes = [EstVendeurOuResponsable]
        return [permission() for permission in permission_classes]


class FactureViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des factures.
    - Création : Vendeur et Responsable Commercial (commande validée requise)
    - Lecture : tous les utilisateurs authentifiés
    """

    serializer_class = FactureSerializer
    permission_classes = [EstVendeurOuResponsable]

    def get_queryset(self):
        queryset = Facture.objects.select_related('commande__client')

        commande_id = self.request.query_params.get('commande')
        if commande_id:
            queryset = queryset.filter(commande_id=commande_id)

        return queryset

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [EstClientOuVendeurOuResponsable]
        else:
            permission_classes = [EstVendeurOuResponsable]
        return [permission() for permission in permission_classes]

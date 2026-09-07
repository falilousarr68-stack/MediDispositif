from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.generics import ListAPIView, CreateAPIView, DestroyAPIView, UpdateAPIView
from rest_framework.permissions import IsAuthenticated

from authentication.models import Role
from catalogue.models import ProduitMedical
from .models import (
    Commande,
    Facture,
    LigneCommande,
    Paiement,
    StatutCommande,
    Panier,
    LignePanier,
    envoyer_facture_email,
)
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
    PanierSerializer,
    AjouterAuPanierSerializer,
    ModifierQuantitePanierSerializer,
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
        Le mode de paiement utilisé est celui choisi par le client lors de la commande.
        """
        print(f"Attempting to validate order with pk: {pk}")
        print(f"Request user: {request.user}, role: {request.user.role}")
        
        try:
            commande = self.get_object()
            print(f"Commande found: {commande}, statut: {commande.statut}, mode_paiement: {commande.mode_paiement}")
            validation_serializer = CommandeValidationSerializer(data=request.data)
            validation_serializer.is_valid(raise_exception=True)
            
            print(f"ATTENTION A propos de valider la commande #{commande.pk}")
            commande.valider_commande()
            
            print(f"OK Commande #{commande.pk} validee avec succes, nouveau statut: {commande.statut}")
            
            serializer = self.get_serializer(commande)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except ValueError as e:
            print(f"Validation error: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Unexpected error: {str(e)}")
            return Response({'error': f"Erreur inattendue: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], url_path='annuler')
    def annuler(self, request, pk=None):
        """
        Annule une commande avec un motif obligatoire pour le Responsable Commercial.
        """
        print(f"Attempting to cancel order with pk: {pk}")
        print(f"Request user: {request.user}, role: {request.user.role}")
        
        commande = self.get_object()
        print(f"Commande found: {commande}, statut: {commande.statut}")
        
        serializer = CommandeValidationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        motif = serializer.validated_data.get('motif', '')

        if request.user.role == Role.RESPONSABLE_COMMERCIAL and not motif:
            return Response(
                {'error': "Le motif d'annulation est obligatoire pour le Responsable Commercial."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            print(f"ATTENTION A propos d'annuler la commande #{commande.pk} avec motif: {motif}")
            commande.annuler_commande(motif)
            print(f"OK Commande #{commande.pk} annulee avec succes, nouveau statut: {commande.statut}")
            
            serializer = self.get_serializer(commande)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except ValueError as e:
            print(f"Annulation error: {str(e)}")
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
    - Création : Vendeur, Responsable Commercial et Administrateur
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

        if self.request.user.role == Role.CLIENT:
            queryset = queryset.filter(commande__client=self.request.user)

        commande_id = self.request.query_params.get('commande')
        if commande_id:
            queryset = queryset.filter(commande_id=commande_id)

        return queryset

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [EstClientOuVendeurOuResponsable]
        else:
            permission_classes = [EstClientOuVendeurOuResponsable]
        return [permission() for permission in permission_classes]

    def create(self, request, *args, **kwargs):
        """Return an existing invoice instead of creating a duplicate."""
        commande_id = request.data.get('idCommande')
        facture = Facture.objects.filter(commande_id=commande_id).first()

        if facture:
            if (
                request.user.role == Role.CLIENT
                and facture.commande.client_id != request.user.id
            ):
                return Response(
                    {'detail': 'Vous ne pouvez pas accéder à cette facture.'},
                    status=status.HTTP_403_FORBIDDEN,
                )
            envoyer_facture_email(facture)
            return Response(FactureSerializer(facture).data, status=status.HTTP_200_OK)

        if (
            request.user.role == Role.CLIENT
            and not Commande.objects.filter(
                pk=commande_id,
                client=request.user,
            ).exists()
        ):
            return Response(
                {'detail': 'Vous ne pouvez pas générer cette facture.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        return super().create(request, *args, **kwargs)


class PanierViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion du panier d'achat.
    - Création/Lecture/Modification/Suppression : Clients uniquement
    """

    serializer_class = PanierSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Retourne uniquement le panier de l'utilisateur connecté."""
        return Panier.objects.filter(client=self.request.user).prefetch_related('lignes__produit')

    def get_object(self):
        """Retourne ou crée le panier de l'utilisateur connecté."""
        panier, created = Panier.objects.get_or_create(client=self.request.user)
        return panier

    def create(self, request, *args, **kwargs):
        """Crée ou retourne le panier de l'utilisateur."""
        panier, created = Panier.objects.get_or_create(client=request.user)
        serializer = self.get_serializer(panier)
        return Response(serializer.data, status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'], url_path='ajouter')
    def ajouter_article(self, request):
        """Ajoute un produit au panier."""
        serializer = AjouterAuPanierSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        produit = serializer.validated_data['produit']
        quantite = serializer.validated_data['quantite']
        
        # Récupérer ou créer le panier
        panier, _ = Panier.objects.get_or_create(client=request.user)
        
        # Vérifier le stock
        if produit.stock < quantite:
            return Response(
                {'error': f'Stock insuffisant. Stock disponible: {produit.stock}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Ajouter ou mettre à jour la ligne de panier
        ligne, created = LignePanier.objects.get_or_create(
            panier=panier,
            produit=produit,
            defaults={'quantite': quantite}
        )
        
        if not created:
            nouvelle_quantite = ligne.quantite + quantite
            if nouvelle_quantite > produit.stock:
                return Response(
                    {'error': f'Stock insuffisant. Stock disponible: {produit.stock}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            ligne.quantite = nouvelle_quantite
            ligne.save()
        
        serializer = PanierSerializer(panier)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
        # Récupérer ou créer le panier
        panier, _ = Panier.objects.get_or_create(client=request.user)
        
        # Vérifier le stock
        if produit.stock < quantite:
            return Response(
                {'error': f'Stock insuffisant. Stock disponible: {produit.stock}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Ajouter ou mettre à jour la ligne de panier
        ligne, created = LignePanier.objects.get_or_create(
            panier=panier,
            produit=produit,
            defaults={'quantite': quantite}
        )
        
        if not created:
            nouvelle_quantite = ligne.quantite + quantite
            if nouvelle_quantite > produit.stock:
                return Response(
                    {'error': f'Stock insuffisant. Stock disponible: {produit.stock}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            ligne.quantite = nouvelle_quantite
            ligne.save()
        
        serializer = PanierSerializer(panier)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['put'], url_path='modifier/(?P<idProduit>[^/.]+)')
    def modifier_quantite(self, request, idProduit=None):
        """Modifie la quantité d'un article dans le panier."""
        try:
            panier = Panier.objects.get(client=request.user)
            ligne = LignePanier.objects.get(panier=panier, produit_id=idProduit)
        except (Panier.DoesNotExist, LignePanier.DoesNotExist):
            return Response(
                {'error': 'Article non trouvé dans le panier'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = ModifierQuantitePanierSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        quantite = serializer.validated_data['quantite']
        
        if quantite > ligne.produit.stock:
            return Response(
                {'error': f'Stock insuffisant. Stock disponible: {ligne.produit.stock}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        ligne.quantite = quantite
        ligne.save()
        
        panier_serializer = PanierSerializer(panier)
        return Response(panier_serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['delete'], url_path='supprimer/(?P<idProduit>[^/.]+)')
    def supprimer_article(self, request, idProduit=None):
        """Supprime un article du panier."""
        try:
            panier = Panier.objects.get(client=request.user)
            ligne = LignePanier.objects.get(panier=panier, produit_id=idProduit)
            ligne.delete()
            
            panier_serializer = PanierSerializer(panier)
            return Response(panier_serializer.data, status=status.HTTP_200_OK)
        except (Panier.DoesNotExist, LignePanier.DoesNotExist):
            return Response(
                {'error': 'Article non trouvé dans le panier'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=False, methods=['delete'], url_path='vider')
    def vider_panier(self, request):
        """Vide le panier de l'utilisateur."""
        try:
            panier = Panier.objects.get(client=request.user)
            panier.lignes.all().delete()
            
            panier_serializer = PanierSerializer(panier)
            return Response(
                {'message': 'Panier vidé avec succès'},
                status=status.HTTP_200_OK
            )
        except Panier.DoesNotExist:
            return Response(
                {'error': 'Panier non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )


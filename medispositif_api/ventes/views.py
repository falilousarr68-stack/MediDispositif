from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from decimal import Decimal
from rest_framework.exceptions import PermissionDenied
from django.db import transaction
from django.db.models import Sum
from django.db import transaction
from django.http import HttpResponse
from systeme.audit import enregistrer_audit
from systeme.models import TypeActionAudit, ParametreSysteme

from datetime import timedelta
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework.decorators import action
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import mm
import os
import requests
from django.shortcuts import get_object_or_404
from rest_framework.permissions import AllowAny

from datetime import timedelta
from django.core.mail import send_mail
from django.utils import timezone
from systeme.models import ParametreSysteme

from uuid import uuid4
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from authentication.models import Role
from .models import (
    Commande,
    Facture,
    LigneCommande,
    Paiement,
    Livraison,
    StatutCommande,
    StatutPaiement,
    StatutLivraison,
)
from .permissions import (
    EstAdministrateur,
    EstClientOuVendeurOuResponsable,
    EstProprietaireCommandeOuResponsable,
    EstProprietaireOuVendeurOuResponsable,
    EstClient,
    LecturePaiementClientOuAdmin,
    EstResponsableCommercial,
    EstVendeurOuResponsable,
    PeutAnnulerCommande,
    PeutValiderCommande,
    LecturePaiementClientOuAdmin,
    LectureLivraison,
    EstGestionnaireStockOuResponsable,
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
    LivraisonSerializer,
)


class CommandeViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des commandes.
    - Clients : peuvent créer leurs commandes et voir les leurs
    - Vendeurs : peuvent voir toutes les commandes
    - Responsable Commercial : full accès
    """

    def get_queryset(self):
        queryset = Commande.objects.select_related(
        'client').prefetch_related( 'lignes__produit'
    )

        user = self.request.user

    # Utilisateur non connecté
        if not user.is_authenticated:
            return Commande.objects.none()

    # Client : uniquement ses commandes
        if user.role == Role.CLIENT:
            queryset = queryset.filter(
            client=user
        )

    # Vendeur : toutes les commandes
        elif user.role == Role.VENDEUR:
            queryset = queryset.all()

# Responsable Commercial : toutes les commandes
        elif user.role == Role.RESPONSABLE_COMMERCIAL:
            queryset = queryset.all()

# Administrateur : toutes les commandes
        elif user.role == Role.ADMINISTRATEUR:
           queryset = queryset.all()

# Autre rôle
        else:
            queryset = queryset.none()

    # Filtre par statut
        statut = self.request.query_params.get('statut')

        if statut:
            queryset = queryset.filter(
            statut=statut
        )

        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            return CommandeListSerializer
        elif self.action == 'create':
            return CommandeCreateSerializer
        return CommandeDetailSerializer

    def get_permissions(self):

    # Administrateur : accès complet aux commandes
        if self.request.user.is_authenticated and self.request.user.role == Role.ADMINISTRATEUR:
            return [EstAdministrateur()]

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

        else:
            permission_classes = [EstProprietaireOuVendeurOuResponsable]

        return [permission() for permission in permission_classes]

    

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

            enregistrer_audit(
        utilisateur=request.user,
        module="Commandes",
        action=TypeActionAudit.ANNULATION,
        description=(
            f"Annulation de la commande #{commande.pk}. "
            f"Motif : {motif}"
        ),
        reference=f"Commande #{commande.pk}",
    )

            serializer = self.get_serializer(commande)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except ValueError as e:
            return Response(
        {'error': str(e)},
        status=status.HTTP_400_BAD_REQUEST
    )
    def perform_create(self, serializer):
        commande = serializer.save()

        enregistrer_audit(
        utilisateur=self.request.user,
        module="Commandes",
        action=TypeActionAudit.CREATION,
        description=f"Création de la commande #{commande.pk}.",
        reference=f"Commande #{commande.pk}",
    )


class LigneCommandeViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des lignes de commande.
    - Lecture : autorisée pour le propriétaire, Vendeur et Responsable
    - Création/Mise à jour : réservée au propriétaire de la commande et au Responsable
    """

    serializer_class = LigneCommandeSerializer
    def get_permissions(self):

        if (
        self.request.user.is_authenticated
        and self.request.user.role == Role.ADMINISTRATEUR
    ):
            return [EstAdministrateur()]

        return [EstProprietaireOuVendeurOuResponsable()]

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

    serializer_class = PaiementSerializer
    permission_classes = [EstVendeurOuResponsable]

    def get_queryset(self):

        queryset = Paiement.objects.select_related(
            'commande__client'
        )

        commande_id = self.request.query_params.get(
            'commande'
        )

        if commande_id:
            queryset = queryset.filter(
                commande_id=commande_id
            )

        if self.request.user.role == Role.CLIENT:

            queryset = queryset.filter(
                commande__client=self.request.user
            )

        return queryset

    def get_permissions(self):

    # Administrateur : accès complet aux paiements
        if (
            self.request.user.is_authenticated
            and self.request.user.role == Role.ADMINISTRATEUR
        ):
            return [EstAdministrateur()]

    # Le Client peut :
    # - créer un paiement
    # - initier un paiement
    # - confirmer un paiement
    # - simuler un échec
    # - renvoyer l'email de confirmation
        if self.action in [
            'create',
            'initier',
            'confirmer_simulation',
            'echouer_simulation',
            'renvoyer_confirmation',
        ]:
            return [EstClient()]

    # Consultation des paiements
        if self.action in [
            'list',
            'retrieve',
        ]:
            return [LecturePaiementClientOuAdmin()]

    # Autres actions : refusées aux autres rôles
        return [EstAdministrateur()]
    # ==========================================================
    # INITIER UN PAIEMENT
    # ==========================================================

    @action(
        detail=False,
        methods=['post'],
        url_path='initier'
    )
    def initier(self, request):

        id_commande = request.data.get(
            'idCommande'
        )

        mode_paiement = request.data.get(
            'mode_paiement'
        )

        if not id_commande:

            return Response(
                {
                    'error':
                    'La commande est obligatoire.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        if not mode_paiement:

            return Response(
                {
                    'error':
                    'Le mode de paiement est obligatoire.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        try:

            commande = Commande.objects.get(
                pk=id_commande
            )

        except Commande.DoesNotExist:

            return Response(
                {
                    'error':
                    'Commande introuvable.'
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # Le client doit être propriétaire
        if request.user.role == Role.CLIENT:

            if commande.client != request.user:

                raise PermissionDenied(
                    "Vous ne pouvez pas payer la commande d'un autre client."
                )

        # Commande annulée
        if commande.statut == StatutCommande.ANNULEE:

            return Response(
                {
                    'error':
                    'Cette commande est annulée.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Total déjà payé
        total_paye = commande.paiements.filter(
            statut=StatutPaiement.REUSSI
        ).aggregate(
            total=Sum('montant')
        )['total'] or Decimal('0.00')

        montant_restant = (
            commande.montant_total
            - total_paye
        )

        if montant_restant <= Decimal('0.00'):

            return Response(
                {
                    'error':
                    'Cette commande est déjà entièrement payée.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ======================================================
        # CRÉATION DU PAIEMENT EN ATTENTE
        # ======================================================

        paiement = Paiement.objects.create(

            commande=commande,

            montant=montant_restant,

            mode_paiement=mode_paiement,

            statut=StatutPaiement.EN_ATTENTE,

            reference=f"SIM-{uuid4().hex[:12].upper()}",
        )

        return Response(
            {
                'message':
                    'Paiement initialisé.',

                'idPaiement':
                    paiement.idPaiement,

                'idCommande':
                    commande.idCommande,

                'montant':
                    str(paiement.montant),

                'mode_paiement':
                    paiement.mode_paiement,

                'statut':
                    paiement.statut,

                'reference':
                    paiement.reference,

                # URL de simulation
                'payment_url':
                    f'/paiements/simulation/{paiement.idPaiement}',
            },
            status=status.HTTP_201_CREATED
        )

    # ==========================================================
    # SIMULER UN PAIEMENT RÉUSSI
    # ==========================================================

    @action(
    detail=True,
    methods=['post'],
    url_path='confirmer-simulation'
)
    def confirmer_simulation(self, request, pk=None):

        with transaction.atomic():

            paiement = self.get_object()

        # Vérifier le propriétaire du paiement
        if request.user.role == Role.CLIENT:
            if paiement.commande.client_id != request.user.id:
                raise PermissionDenied(
                    "Vous ne pouvez pas confirmer ce paiement."
                )

        # Vérifier que le paiement est encore en attente
        if paiement.statut != StatutPaiement.EN_ATTENTE:
            return Response(
                {
                    'error': 'Ce paiement a déjà été traité.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        commande = paiement.commande

        # Vérifier que la commande est encore en cours
        if commande.statut != StatutCommande.EN_COURS:
            return Response(
                {
                    'error': 'Cette commande ne peut plus être payée.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ======================================================
        # VÉRIFIER LE STOCK AVANT DE CONFIRMER LE PAIEMENT
        # ======================================================

        for ligne in commande.lignes.select_related('produit').all():

            if ligne.produit.stock < ligne.quantite:

                return Response(
                    {
                        'error': (
                            f"Stock insuffisant pour {ligne.produit.nom}. "
                            f"Disponible : {ligne.produit.stock}, "
                            f"Demandé : {ligne.quantite}."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

        # ======================================================
        # VALIDER LA COMMANDE
        # ======================================================

        try:
            commande.valider_commande()

        except ValueError as e:
            return Response(
                {
                    'error': str(e)
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ======================================================
        # CONFIRMER LE PAIEMENT
        # ======================================================

        paiement.statut = StatutPaiement.REUSSI

        paiement.save(
            update_fields=['statut']
        )

        enregistrer_audit(
    utilisateur=request.user,
    module="Paiements",
    action=TypeActionAudit.PAIEMENT,
    description=(
        f"Paiement confirmé pour la commande #{commande.pk}. "
        f"Montant : {paiement.montant} FCFA. "
        f"Mode : {paiement.get_mode_paiement_display()}."
    ),
    reference=f"Paiement #{paiement.pk}",
)

        # ======================================================
        # GÉNÉRER LA FACTURE
        # ======================================================

        facture, created = Facture.objects.get_or_create(
            commande=commande,
            defaults={
                'montant': commande.montant_total,
            }
        )

        if created:
            enregistrer_audit(
        utilisateur=request.user,
        module="Factures",
        action=TypeActionAudit.GENERATION,
        description=(
            f"Génération de la facture pour la commande #{commande.pk}. "
            f"Montant : {facture.montant} FCFA."
        ),
        reference=f"Facture #{facture.pk}",
        )

                # ======================================================
        # CRÉER AUTOMATIQUEMENT LA LIVRAISON
        # ======================================================

        parametre_delai = ParametreSysteme.objects.filter(
            nom="delai_livraison"
        ).first()

        if parametre_delai:
            try:
                delai_livraison = int(parametre_delai.valeur)
            except (ValueError, TypeError):
                delai_livraison = 3
        else:
            delai_livraison = 3

        date_prevue = (
            timezone.localdate()
            + timedelta(days=delai_livraison)
        )

        livraison, livraison_created = Livraison.objects.get_or_create(
            commande=commande,
            defaults={
                'adresse_livraison': commande.client.adresse,
                'telephone_contact': commande.client.telephone,
                'date_prevue': date_prevue,
                'statut': StatutLivraison.A_PREPARER,
            }
        )

        if livraison_created:
            enregistrer_audit(
                utilisateur=request.user,
                module="Livraisons",
                action=TypeActionAudit.CREATION,
                description=(
                    f"Création automatique de la livraison "
                    f"pour la commande #{commande.pk}. "
                    f"Date prévue : "
                    f"{livraison.date_prevue.strftime('%d/%m/%Y')}."
                ),
                reference=f"Livraison #{livraison.pk}",
            )

                # ======================================================
        # ENVOYER L'EMAIL DE CONFIRMATION AU CLIENT
        # ======================================================

        montant_produits = (
        commande.montant_total
        - commande.frais_livraison
        )

        sujet = f"Confirmation de votre commande #{commande.pk} - MEDIDISPOSITIF"

            
        message = f"""
Bonjour {commande.client.prenom} {commande.client.nom},

Nous vous confirmons que votre commande #{commande.pk} a été validée avec succès.

DÉTAILS DE LA COMMANDE
----------------------
Numéro de commande : #{commande.pk}
Montant des produits : {montant_produits} FCFA
Frais de livraison : {commande.frais_livraison} FCFA
Total payé : {commande.montant_total} FCFA
Mode de paiement : {paiement.get_mode_paiement_display()}
Référence du paiement : {paiement.reference}

FACTURE
-------
Numéro de facture : {facture.numero}
Montant : {facture.montant} FCFA

LIVRAISON
---------
Adresse : {livraison.adresse_livraison}
Téléphone : {livraison.telephone_contact}
Date prévue : {livraison.date_prevue.strftime('%d/%m/%Y')}
Statut : {livraison.get_statut_display()}

Votre commande est actuellement en attente de préparation.

Vous recevrez des informations supplémentaires lorsque le statut de votre livraison évoluera.

Merci pour votre confiance.

MEDIDISPOSITIF
Gestion de vente de dispositifs médicaux
"""

        try:
            send_mail(
                subject=sujet,
                message=message,
                from_email=None,
                recipient_list=[commande.client.email],
                fail_silently=False,
            )

        except Exception as e:
            enregistrer_audit(
                utilisateur=request.user,
                module="Emails",
                action=TypeActionAudit.MODIFICATION,
                description=(
                    f"Échec de l'envoi de l'email de confirmation "
                    f"pour la commande #{commande.pk}. "
                    f"Erreur : {str(e)}"
                ),
                reference=f"Commande #{commande.pk}",
            )

        return Response(
            {
                'message': 'Paiement confirmé avec succès.',

                'idPaiement':
                    paiement.idPaiement,

                'idCommande':
                    commande.idCommande,

                'statut':
                    paiement.statut,

                'commande_statut':
                    commande.statut,

                'reference':
                    paiement.reference,

                'facture': {
                    'id': facture.id,
                    'numero': facture.numero,
                    'montant': str(facture.montant),
                },

                                'livraison': {
                    'id': livraison.id,
                    'statut': livraison.statut,
                    'statut_display': livraison.get_statut_display(),
                    'date_prevue': livraison.date_prevue.strftime('%d/%m/%Y'),
                    'adresse_livraison': livraison.adresse_livraison,
                    'telephone_contact': livraison.telephone_contact,
                },
            },
            status=status.HTTP_200_OK
        )


        # ==========================================================
    # RENVOYER L'EMAIL DE CONFIRMATION
    # ==========================================================

    @action(
        detail=True,
        methods=['post'],
        url_path='renvoyer-confirmation'
    )
    def renvoyer_confirmation(
        self,
        request,
        pk=None
    ):
        paiement = self.get_object()
        commande = paiement.commande

        # Le client ne peut renvoyer l'email
        # que pour son propre paiement.
        if request.user.role == Role.CLIENT:

            if commande.client != request.user:
                raise PermissionDenied(
                    "Vous ne pouvez pas renvoyer cet email."
                )

        # Le paiement doit être réussi.
        if paiement.statut != StatutPaiement.REUSSI:
            return Response(
                {
                    'error':
                    "L'email ne peut être renvoyé que pour "
                    "un paiement réussi."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # La commande doit être validée.
        if commande.statut != StatutCommande.VALIDEE:
            return Response(
                {
                    'error':
                    "La commande n'est pas encore validée."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Récupérer la facture.
        try:
            facture = commande.facture
        except Facture.DoesNotExist:
            return Response(
                {
                    'error':
                    "Aucune facture n'est associée à cette commande."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Récupérer la livraison.
        try:
            livraison = commande.livraison
        except Livraison.DoesNotExist:
            return Response(
                {
                    'error':
                    "Aucune livraison n'est associée à cette commande."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        montant_produits = (
            commande.montant_total
            - commande.frais_livraison
        )

        sujet = (
            f"Confirmation de votre commande "
            f"#{commande.pk} - MEDIDISPOSITIF"
        )

        message = f"""
Bonjour {commande.client.prenom} {commande.client.nom},

Nous vous confirmons que votre commande #{commande.pk}
a été validée avec succès.

DÉTAILS DE LA COMMANDE
----------------------
Numéro de commande : #{commande.pk}
Montant des produits : {montant_produits} FCFA
Frais de livraison : {commande.frais_livraison} FCFA
Total payé : {commande.montant_total} FCFA
Mode de paiement : {paiement.get_mode_paiement_display()}
Référence du paiement : {paiement.reference}

FACTURE
-------
Numéro de facture : {facture.numero}
Montant : {facture.montant} FCFA

LIVRAISON
---------
Adresse : {livraison.adresse_livraison}
Téléphone : {livraison.telephone_contact}
Date prévue : {livraison.date_prevue.strftime('%d/%m/%Y')}
Statut : {livraison.get_statut_display()}

Votre commande est actuellement en attente de préparation.

Vous recevrez des informations supplémentaires
lorsque le statut de votre livraison évoluera.

Merci pour votre confiance.

MEDIDISPOSITIF
Gestion de vente de dispositifs médicaux
"""

        try:

            send_mail(
                subject=sujet,
                message=message,
                from_email=None,
                recipient_list=[commande.client.email],
                fail_silently=False,
            )

        except Exception as e:

            enregistrer_audit(
                utilisateur=request.user,
                module="Emails",
                action=TypeActionAudit.MODIFICATION,
                description=(
                    f"Échec du renvoi de l'email de confirmation "
                    f"pour la commande #{commande.pk}. "
                    f"Erreur : {str(e)}"
                ),
                reference=f"Commande #{commande.pk}",
            )

            return Response(
                {
                    'error':
                    "L'envoi de l'email a échoué. "
                    "Veuillez réessayer plus tard."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        enregistrer_audit(
            utilisateur=request.user,
            module="Emails",
            action=TypeActionAudit.MODIFICATION,
            description=(
                f"Email de confirmation renvoyé avec succès "
                f"pour la commande #{commande.pk}."
            ),
            reference=f"Commande #{commande.pk}",
        )

        return Response(
            {
                'message':
                    "L'email de confirmation a été renvoyé avec succès.",
                'email': commande.client.email,
                'idCommande': commande.idCommande,
            },
            status=status.HTTP_200_OK
        )

    # ==========================================================
    # SIMULER UN ÉCHEC
    # ==========================================================

    @action(
        detail=True,
        methods=['post'],
        url_path='echouer-simulation'
    )
    def echouer_simulation(
        self,
        request,
        pk=None
    ):

        paiement = self.get_object()

        if request.user.role == Role.CLIENT:

            if paiement.commande.client != request.user:

                raise PermissionDenied(
                    "Vous ne pouvez pas modifier ce paiement."
                )

        if paiement.statut != StatutPaiement.EN_ATTENTE:

            return Response(
                {
                    'error':
                    'Ce paiement a déjà été traité.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        paiement.statut = StatutPaiement.ECHOUE

        paiement.save(
            update_fields=['statut']
        )

        return Response(
            {
                'message':
                    'Le paiement a échoué.',

                'idPaiement':
                    paiement.idPaiement,

                'statut':
                    paiement.statut,
            },
            status=status.HTTP_200_OK
        )


class FactureViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des factures.

    - Client : consulte uniquement ses propres factures
    - Vendeur : consulte et gère les factures
    - Responsable Commercial : consulte et gère les factures
    - Administrateur : accès complet aux factures
    """

    serializer_class = FactureSerializer
    permission_classes = [EstVendeurOuResponsable]

    def get_queryset(self):
        queryset = Facture.objects.select_related(
            'commande__client'
        )

        user = self.request.user

        # Utilisateur non connecté
        if not user.is_authenticated:
            return Facture.objects.none()

        # Client : uniquement ses propres factures
        if user.role == Role.CLIENT:
            queryset = queryset.filter(
                commande__client=user
            )

        # Vendeur, Responsable et Administrateur :
        # accès à toutes les factures
        elif user.role in [
            Role.VENDEUR,
            Role.RESPONSABLE_COMMERCIAL,
            Role.ADMINISTRATEUR,
        ]:
            queryset = queryset.all()

        # Autres rôles
        else:
            queryset = queryset.none()

        # Filtre optionnel par commande
        commande_id = self.request.query_params.get('commande')

        if commande_id:
            queryset = queryset.filter(
                commande_id=commande_id
            )

        return queryset

    def get_permissions(self):

        # Administrateur : accès complet
        if (
            self.request.user.is_authenticated
            and self.request.user.role == Role.ADMINISTRATEUR
        ):
            return [EstAdministrateur()]

        # Client : consultation uniquement
        if self.action in ['list', 'retrieve', 'pdf']:
            permission_classes = [
                EstClientOuVendeurOuResponsable
            ]

        # Vendeur et Responsable : gestion
        else:
            permission_classes = [
                EstVendeurOuResponsable
            ]

        return [
            permission()
            for permission in permission_classes
        ]

    @action(detail=True, methods=['get'], url_path='pdf')
    def pdf(self, request, pk=None):
        facture = self.get_object()
        commande = facture.commande

        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = (
            f'attachment; filename="facture-{facture.numero}.pdf"'
        )

        pdf = canvas.Canvas(response, pagesize=A4)

        largeur, hauteur = A4

        # =========================
        # EN-TÊTE
        # =========================
        pdf.setFont("Helvetica-Bold", 20)
        pdf.drawString(20 * mm, hauteur - 25 * mm, "MEDIDISPOSITIF")

        pdf.setFont("Helvetica-Bold", 16)
        pdf.drawRightString(
            largeur - 20 * mm,
            hauteur - 25 * mm,
            "FACTURE"
        )

        pdf.setFont("Helvetica", 10)
        pdf.drawString(
            20 * mm,
            hauteur - 35 * mm,
            "Gestion de vente de dispositifs médicaux"
        )

        # Ligne
        pdf.line(
            20 * mm,
            hauteur - 42 * mm,
            largeur - 20 * mm,
            hauteur - 42 * mm
        )

        # =========================
        # INFORMATIONS FACTURE
        # =========================
        y = hauteur - 58 * mm

        pdf.setFont("Helvetica-Bold", 10)
        pdf.drawString(20 * mm, y, "Numéro de facture :")
        pdf.setFont("Helvetica", 10)
        pdf.drawString(60 * mm, y, facture.numero)

        y -= 7 * mm

        pdf.setFont("Helvetica-Bold", 10)
        pdf.drawString(20 * mm, y, "Date d'émission :")
        pdf.setFont("Helvetica", 10)
        pdf.drawString(
            60 * mm,
            y,
            facture.date_emission.strftime("%d/%m/%Y")
        )

        y -= 15 * mm

        # =========================
        # CLIENT
        # =========================
        pdf.setFont("Helvetica-Bold", 11)
        pdf.drawString(20 * mm, y, "CLIENT")

        y -= 7 * mm

        client = commande.client

        pdf.setFont("Helvetica", 10)
        pdf.drawString(
            20 * mm,
            y,
            f"Nom : {client.nom} {client.prenom}"
        )

        y -= 6 * mm

        pdf.drawString(
            20 * mm,
            y,
            f"Email : {client.email}"
        )

        if client.telephone:
            y -= 6 * mm
            pdf.drawString(
                20 * mm,
                y,
                f"Téléphone : {client.telephone}"
            )

        # =========================
        # COMMANDE
        # =========================
        y -= 15 * mm

        pdf.setFont("Helvetica-Bold", 11)
        pdf.drawString(20 * mm, y, "COMMANDE")

        y -= 7 * mm

        pdf.setFont("Helvetica", 10)
        pdf.drawString(
            20 * mm,
            y,
            f"Commande N° {commande.id}"
        )

        y -= 6 * mm

        pdf.drawString(
            20 * mm,
            y,
            f"Date : {commande.date_commande.strftime('%d/%m/%Y %H:%M')}"
        )

        # =========================
        # TABLEAU PRODUITS
        # =========================
        y -= 15 * mm

        pdf.setFont("Helvetica-Bold", 10)

        pdf.drawString(20 * mm, y, "Produit")
        pdf.drawString(105 * mm, y, "Qté")
        pdf.drawString(125 * mm, y, "Prix unitaire")
        pdf.drawString(165 * mm, y, "Montant")

        y -= 3 * mm

        pdf.line(
            20 * mm,
            y,
            largeur - 20 * mm,
            y
        )

        y -= 7 * mm

        pdf.setFont("Helvetica", 9)

        for ligne in commande.lignes.select_related("produit").all():

            nom_produit = ligne.produit.nom

            # Évite que les noms trop longs débordent
            if len(nom_produit) > 38:
                nom_produit = nom_produit[:35] + "..."

            pdf.drawString(
                20 * mm,
                y,
                nom_produit
            )

            pdf.drawRightString(
                118 * mm,
                y,
                str(ligne.quantite)
            )

            pdf.drawRightString(
                158 * mm,
                y,
                f"{ligne.prix_unitaire:.2f} FCFA"
            )

            pdf.drawRightString(
                largeur - 20 * mm,
                y,
                f"{ligne.montant:.2f} FCFA"
            )

            y -= 7 * mm

            # Nouvelle page si nécessaire
            if y < 40 * mm:
                pdf.showPage()
                y = hauteur - 25 * mm
                pdf.setFont("Helvetica", 9)

        # =========================
        # TOTAL
        # =========================
        y -= 5 * mm

        pdf.line(
            120 * mm,
            y,
            largeur - 20 * mm,
            y
        )

        y -= 10 * mm

        pdf.setFont("Helvetica-Bold", 12)

        pdf.drawString(
            120 * mm,
            y,
            "TOTAL :"
        )

        pdf.drawRightString(
            largeur - 20 * mm,
            y,
            f"{facture.montant:.2f} FCFA"
        )

        # =========================
        # STATUT
        # =========================
        y -= 15 * mm

        pdf.setFont("Helvetica-Bold", 10)
        pdf.drawString(
            20 * mm,
            y,
            "Statut : COMMANDE VALIDÉE"
        )

        # =========================
        # PIED DE PAGE
        # =========================
        pdf.setFont("Helvetica", 8)

        pdf.drawCentredString(
            largeur / 2,
            15 * mm,
            "Merci pour votre confiance."
        )

        pdf.drawCentredString(
            largeur / 2,
            10 * mm,
            "MEDIDISPOSITIF - Gestion de vente de dispositifs médicaux"
        )

        pdf.save()

        return response

class LivraisonViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des livraisons.

    - Client : consulte uniquement ses propres livraisons.
    - Gestionnaire de Stock : consulte et met à jour les livraisons.
    - Responsable Commercial : consulte et supervise les livraisons.
    - Administrateur : accès complet.
    
    La création d'une livraison sera automatique
    après validation du paiement.
    """

    serializer_class = LivraisonSerializer

    def get_queryset(self):
        queryset = Livraison.objects.select_related(
            'commande__client'
        )

        user = self.request.user

        if not user.is_authenticated:
            return Livraison.objects.none()

        # Client : uniquement ses propres livraisons
        if user.role == Role.CLIENT:
            queryset = queryset.filter(
                commande__client=user
            )

        # Gestionnaire de Stock
        elif user.role == Role.GESTIONNAIRE_STOCK:
            queryset = queryset.all()

        # Responsable Commercial
        elif user.role == Role.RESPONSABLE_COMMERCIAL:
            queryset = queryset.all()

        # Administrateur
        elif user.role == Role.ADMINISTRATEUR:
            queryset = queryset.all()

        # Autres rôles
        else:
            queryset = queryset.none()

        # Filtre optionnel par commande
        commande_id = self.request.query_params.get('commande')

        if commande_id:
            queryset = queryset.filter(
                commande_id=commande_id
            )

        # Filtre optionnel par statut
        statut = self.request.query_params.get('statut')

        if statut:
            queryset = queryset.filter(
                statut=statut
            )

        return queryset

    def get_permissions(self):

        # Administrateur : accès complet
        if (
            self.request.user.is_authenticated
            and self.request.user.role == Role.ADMINISTRATEUR
        ):
            return [EstAdministrateur()]

        # Consultation des livraisons
        if self.action in ['list', 'retrieve']:
            return [LectureLivraison()]

        # Modification du statut
        if self.action in ['update', 'partial_update']:
            return [EstGestionnaireStockOuResponsable()]

        # Création et suppression interdites
        # La livraison sera créée automatiquement
        # après paiement réussi.
        return [EstAdministrateur()]

    def perform_update(self, serializer):

        livraison = self.get_object()

        ancien_statut = livraison.statut

        nouveau_statut = serializer.validated_data.get(
            'statut',
            ancien_statut
        )

    # ======================================================
    # DATE D'EXPÉDITION
    # ======================================================

        if (
            nouveau_statut == StatutLivraison.EXPEDIEE
            and livraison.date_expedition is None
        ):
            livraison.date_expedition = timezone.now()

    # ======================================================
    # DATE DE LIVRAISON
    # ======================================================

        if (
            nouveau_statut == StatutLivraison.LIVREE
            and livraison.date_livraison is None
        ):
            livraison.date_livraison = timezone.now()

    # ======================================================
    # SAUVEGARDE
    # ======================================================

        livraison.statut = nouveau_statut
        livraison.save()

    # ======================================================
    # AUDIT DU CHANGEMENT DE STATUT
    # ======================================================

        if ancien_statut != nouveau_statut:

            enregistrer_audit(
                utilisateur=self.request.user,
                module="Livraisons",
                action=TypeActionAudit.MODIFICATION,
                description=(
                    f"Modification du statut de la livraison "
                    f"de la commande #{livraison.commande.pk} : "
                    f"{ancien_statut} → {nouveau_statut}."
                ),
                reference=f"Livraison #{livraison.pk}",
            )

            # ======================================================
        # EMAIL AU CLIENT
        # ======================================================

        if (
            ancien_statut != nouveau_statut
            and nouveau_statut in [
                StatutLivraison.EXPEDIEE,
                StatutLivraison.LIVREE,
            ]
        ):

            client = livraison.commande.client

            sujet = None
            message = None

            # --------------------------------------------------
            # EMAIL : COMMANDE EXPÉDIÉE
            # --------------------------------------------------

            if nouveau_statut == StatutLivraison.EXPEDIEE:

                sujet = (
                    f"Votre commande #{livraison.commande.pk} "
                    f"a été expédiée - MEDIDISPOSITIF"
                )

                message = f"""
Bonjour {client.prenom} {client.nom},

Nous vous informons que votre commande #{livraison.commande.pk}
a été expédiée.

DÉTAILS DE LA LIVRAISON
-----------------------
Numéro de commande : #{livraison.commande.pk}
Adresse de livraison : {livraison.adresse_livraison}
Téléphone : {livraison.telephone_contact}
Date prévue : {livraison.date_prevue.strftime('%d/%m/%Y')}
Date d'expédition : {livraison.date_expedition.strftime('%d/%m/%Y %H:%M')}
Statut : {livraison.get_statut_display()}

Votre commande est actuellement en cours d'acheminement.

Merci pour votre confiance.

MEDIDISPOSITIF
Gestion de vente de dispositifs médicaux
"""

            # --------------------------------------------------
            # EMAIL : COMMANDE LIVRÉE
            # --------------------------------------------------

            elif nouveau_statut == StatutLivraison.LIVREE:

                sujet = (
                    f"Votre commande #{livraison.commande.pk} "
                    f"a été livrée - MEDIDISPOSITIF"
                )

                message = f"""
Bonjour {client.prenom} {client.nom},

Nous vous confirmons que votre commande #{livraison.commande.pk}
a été livrée avec succès.

DÉTAILS DE LA LIVRAISON
-----------------------
Numéro de commande : #{livraison.commande.pk}
Adresse de livraison : {livraison.adresse_livraison}
Téléphone : {livraison.telephone_contact}
Date de livraison : {livraison.date_livraison.strftime('%d/%m/%Y %H:%M')}
Statut : {livraison.get_statut_display()}

Nous vous remercions pour votre confiance et espérons
que votre commande vous donnera entière satisfaction.

MEDIDISPOSITIF
Gestion de vente de dispositifs médicaux
"""

            # --------------------------------------------------
            # ENVOI
            # --------------------------------------------------

            if sujet and message:

                try:

                    send_mail(
                        subject=sujet,
                        message=message,
                        from_email=None,
                        recipient_list=[client.email],
                        fail_silently=False,
                    )

                except Exception as e:

                    enregistrer_audit(
                        utilisateur=self.request.user,
                        module="Emails",
                        action=TypeActionAudit.MODIFICATION,
                        description=(
                            f"Échec de l'envoi de l'email concernant "
                            f"la livraison de la commande "
                            f"#{livraison.commande.pk}. "
                            f"Statut : {nouveau_statut}. "
                            f"Erreur : {str(e)}"
                        ),
                        reference=f"Livraison #{livraison.pk}",
                    )
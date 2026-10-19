from io import BytesIO
from datetime import datetime
from django.db import models
from django.core.files.base import ContentFile
from django.db.models import Sum, Count
from django.http import HttpResponse

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import BasePermission

from authentication.models import Role, Utilisateur
from catalogue.models import (
    ProduitMedical,
    Approvisionnement,
    DetailsApprovisionnement,
)
from ventes.models import (
    Commande,
    LigneCommande,
    Paiement,
    Facture,
    StatutCommande,
    StatutPaiement,
)

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
)

from authentication.models import Role
from .models import ParametreSysteme, Rapport, TypeRapport, JournalAudit
from .permissions import EstAdministrateur, LectureTousEcritureAdministrateur
from .serializers import (
    ParametreSystemeCreateSerializer,
    ParametreSystemeSerializer,
    RapportCreateSerializer,
    RapportDetailSerializer,
    RapportListSerializer,
    JournalAuditSerializer,
)


# ============================================================
# PARAMÈTRES SYSTÈME
# ============================================================

class ParametreSystemeViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des paramètres système.
    Accès réservé exclusivement à l'Administrateur.
    """

    queryset = ParametreSysteme.objects.all()
    permission_classes = [EstAdministrateur]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ParametreSystemeCreateSerializer
        return ParametreSystemeSerializer

    @action(detail=False, methods=['get'], url_path='par-nom')
    def par_nom(self, request):
        """Récupère un paramètre par son nom via query parameter."""

        nom = request.query_params.get('nom')

        if not nom:
            return Response(
                {'error': "Le paramètre 'nom' est requis."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            parametre = ParametreSysteme.objects.get(nom=nom)
            serializer = self.get_serializer(parametre)
            return Response(serializer.data)

        except ParametreSysteme.DoesNotExist:
            return Response(
                {'error': f"Paramètre '{nom}' non trouvé."},
                status=status.HTTP_404_NOT_FOUND,
            )


# ============================================================
# RAPPORTS
# ============================================================

class RapportViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des rapports.

    Lecture :
        Tous les utilisateurs authentifiés.

    Création / modification / suppression :
        Administrateur uniquement.

    Génération :
        Administrateur uniquement.
    """

    queryset = Rapport.objects.select_related('genere_par').all()
    permission_classes = [LectureTousEcritureAdministrateur]

    def get_serializer_class(self):
        if self.action == 'list':
            return RapportListSerializer

        if self.action == 'create':
            return RapportCreateSerializer

        return RapportDetailSerializer

    # ========================================================
    # CRÉATION MANUELLE D'UN RAPPORT
    # ========================================================

    def perform_create(self, serializer):
        """Associe automatiquement l'administrateur au rapport."""

        if self.request.user.role != Role.ADMINISTRATEUR:
            from rest_framework.exceptions import PermissionDenied

            raise PermissionDenied(
                "Seuls les administrateurs peuvent créer des rapports."
            )

        serializer.save(genere_par=self.request.user)

    # ========================================================
    # FILTRES
    # ========================================================

    def get_queryset(self):
        queryset = super().get_queryset()

        type_rapport = self.request.query_params.get('type')

        if type_rapport:
            queryset = queryset.filter(
                type_rapport=type_rapport
            )

        date_debut = self.request.query_params.get('date_debut')

        date_fin = self.request.query_params.get('date_fin')

        if date_debut:
            queryset = queryset.filter(
                date_generation__date__gte=date_debut
            )

        if date_fin:
            queryset = queryset.filter(
                date_generation__date__lte=date_fin
            )

        return queryset

    # ========================================================
    # TYPES DE RAPPORTS
    # ========================================================

    @action(detail=False, methods=['get'], url_path='types')
    def types_rapports(self, request):
        """Retourne la liste des types de rapports disponibles."""

        types = [
            {
                'value': key,
                'label': label
            }
            for key, label in TypeRapport.choices
        ]

        return Response(types)

    # ========================================================
    # GÉNÉRATION D'UN RAPPORT PDF
    # ========================================================

    @action(
        detail=False,
        methods=['post'],
        url_path='generer'
    )
    def generer(self, request):
        """
        Génère un rapport PDF à partir des données du système.
        """

        # ----------------------------------------------------
        # VÉRIFICATION ADMINISTRATEUR
        # ----------------------------------------------------

        if (
            not request.user.is_authenticated
            or request.user.role != Role.ADMINISTRATEUR
        ):
            return Response(
                {
                    'detail':
                        "Seuls les administrateurs peuvent générer des rapports."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # ----------------------------------------------------
        # RÉCUPÉRATION DES PARAMÈTRES
        # ----------------------------------------------------

        type_rapport = request.data.get('type_rapport')
        periode_debut = request.data.get('periode_debut')
        periode_fin = request.data.get('periode_fin')
        commentaires = request.data.get('commentaires', '')

        if not type_rapport:
            return Response(
                {
                    'type_rapport':
                        "Le type de rapport est obligatoire."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        types_valides = [
            choix[0]
            for choix in TypeRapport.choices
        ]

        if type_rapport not in types_valides:
            return Response(
                {
                    'type_rapport':
                        "Le type de rapport sélectionné est invalide."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ----------------------------------------------------
        # VALIDATION DES DATES
        # ----------------------------------------------------

        date_debut = None
        date_fin = None

        try:
            if periode_debut:
                date_debut = datetime.strptime(
                    periode_debut,
                    '%Y-%m-%d'
                ).date()

            if periode_fin:
                date_fin = datetime.strptime(
                    periode_fin,
                    '%Y-%m-%d'
                ).date()

        except ValueError:
            return Response(
                {
                    'detail':
                        "Les dates doivent être au format AAAA-MM-JJ."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if (
            date_debut
            and date_fin
            and date_debut > date_fin
        ):
            return Response(
                {
                    'detail':
                        "La date de début doit être antérieure à la date de fin."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ----------------------------------------------------
# INTERDICTION D'UNE DATE FUTURE
# ----------------------------------------------------

        date_aujourd_hui = datetime.now().date()

        if date_debut and date_debut > date_aujourd_hui:
            return Response(
            {
                'detail':
                    "La date de début ne peut pas être dans le futur."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

        if date_fin and date_fin > date_aujourd_hui:
            return Response(
            {
                'detail':
                    "La date de fin ne peut pas être dans le futur."
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

        # ----------------------------------------------------
        # TITRE
        # ----------------------------------------------------

        labels = dict(TypeRapport.choices)

        titre = labels.get(
            type_rapport,
            type_rapport
        )

        # ----------------------------------------------------
        # STYLES PDF
        # ----------------------------------------------------

        styles = getSampleStyleSheet()

        titre_style = ParagraphStyle(
            'TitreRapport',
            parent=styles['Title'],
            fontName='Helvetica-Bold',
            fontSize=20,
            alignment=TA_CENTER,
            spaceAfter=10 * mm,
        )

        sous_titre_style = ParagraphStyle(
            'SousTitre',
            parent=styles['Normal'],
            fontSize=10,
            alignment=TA_CENTER,
            textColor=colors.grey,
            spaceAfter=8 * mm,
        )

        section_style = ParagraphStyle(
            'Section',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=13,
            spaceBefore=5 * mm,
            spaceAfter=4 * mm,
        )

        normal_style = ParagraphStyle(
            'NormalRapport',
            parent=styles['Normal'],
            fontSize=9,
            leading=12,
        )

        # ----------------------------------------------------
        # DOCUMENT PDF
        # ----------------------------------------------------

        buffer = BytesIO()

        document = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=15 * mm,
            leftMargin=15 * mm,
            topMargin=15 * mm,
            bottomMargin=15 * mm,
        )

        elements = []

        # ----------------------------------------------------
        # EN-TÊTE
        # ----------------------------------------------------

        elements.append(
            Paragraph(
                "MEDIDISPOSITIF",
                titre_style
            )
        )

        elements.append(
            Paragraph(
                "Gestion de vente de dispositifs médicaux",
                sous_titre_style
            )
        )

        elements.append(
            Paragraph(
                f"<b>{titre}</b>",
                section_style
            )
        )

        periode_texte = "Toutes les périodes"

        if date_debut and date_fin:
            periode_texte = (
                f"Du {date_debut.strftime('%d/%m/%Y')} "
                f"au {date_fin.strftime('%d/%m/%Y')}"
            )

        elif date_debut:
            periode_texte = (
                f"À partir du "
                f"{date_debut.strftime('%d/%m/%Y')}"
            )

        elif date_fin:
            periode_texte = (
                f"Jusqu'au "
                f"{date_fin.strftime('%d/%m/%Y')}"
            )

        elements.append(
            Paragraph(
                f"<b>Période :</b> {periode_texte}",
                normal_style
            )
        )

        elements.append(
            Paragraph(
                f"<b>Généré le :</b> "
                f"{datetime.now().strftime('%d/%m/%Y %H:%M')}",
                normal_style
            )
        )

        elements.append(Spacer(1, 8 * mm))

        # ====================================================
        # RAPPORT DES VENTES
        # ====================================================

        if type_rapport == TypeRapport.VENTES:

            queryset = Commande.objects.all()

            if date_debut:
                queryset = queryset.filter(
                    date_commande__date__gte=date_debut
                )

            if date_fin:
                queryset = queryset.filter(
                    date_commande__date__lte=date_fin
                )

            nombre_commandes = queryset.count()

            commandes_validees = queryset.filter(
                statut=StatutCommande.VALIDEE
            ).count()

            commandes_annulees = queryset.filter(
                statut=StatutCommande.ANNULEE
            ).count()

            chiffre_affaires = (
                queryset
                .filter(statut=StatutCommande.VALIDEE)
                .aggregate(
                    total=Sum('montant_total')
                )['total']
                or 0
            )

            elements.append(
                Paragraph(
                    "Résumé des ventes",
                    section_style
                )
            )

            resume = [
                ["Indicateur", "Valeur"],
                ["Nombre de commandes", str(nombre_commandes)],
                ["Commandes validées", str(commandes_validees)],
                ["Commandes annulées", str(commandes_annulees)],
                [
                    "Chiffre d'affaires",
                    f"{chiffre_affaires} FCFA"
                ],
            ]

            table = Table(
                resume,
                colWidths=[100 * mm, 70 * mm]
            )

            table.setStyle(
                TableStyle([
                    (
                        'BACKGROUND',
                        (0, 0),
                        (-1, 0),
                        colors.HexColor('#1d4ed8')
                    ),
                    (
                        'TEXTCOLOR',
                        (0, 0),
                        (-1, 0),
                        colors.white
                    ),
                    (
                        'FONTNAME',
                        (0, 0),
                        (-1, 0),
                        'Helvetica-Bold'
                    ),
                    (
                        'GRID',
                        (0, 0),
                        (-1, -1),
                        0.5,
                        colors.grey
                    ),
                    (
                        'PADDING',
                        (0, 0),
                        (-1, -1),
                        6
                    ),
                ])
            )

            elements.append(table)

            elements.append(Spacer(1, 8 * mm))

            elements.append(
                Paragraph(
                    "Détail des commandes",
                    section_style
                )
            )

            commandes = queryset.select_related(
                'client'
            ).order_by('-date_commande')

            donnees = [
                [
                    "N°",
                    "Client",
                    "Date",
                    "Statut",
                    "Montant"
                ]
            ]

            for commande in commandes:

                client = (
                    f"{commande.client.prenom} "
                    f"{commande.client.nom}"
                )

                donnees.append([
                    str(commande.id),
                    client,
                    commande.date_commande.strftime(
                        '%d/%m/%Y'
                    ),
                    commande.get_statut_display(),
                    f"{commande.montant_total} FCFA",
                ])

            table = Table(
                donnees,
                colWidths=[
                    15 * mm,
                    55 * mm,
                    30 * mm,
                    35 * mm,
                    35 * mm,
                ],
                repeatRows=1,
            )

            table.setStyle(
                TableStyle([
                    (
                        'BACKGROUND',
                        (0, 0),
                        (-1, 0),
                        colors.HexColor('#1d4ed8')
                    ),
                    (
                        'TEXTCOLOR',
                        (0, 0),
                        (-1, 0),
                        colors.white
                    ),
                    (
                        'FONTNAME',
                        (0, 0),
                        (-1, 0),
                        'Helvetica-Bold'
                    ),
                    (
                        'GRID',
                        (0, 0),
                        (-1, -1),
                        0.4,
                        colors.grey
                    ),
                    (
                        'FONTSIZE',
                        (0, 0),
                        (-1, -1),
                        8
                    ),
                    (
                        'PADDING',
                        (0, 0),
                        (-1, -1),
                        5
                    ),
                ])
            )

            elements.append(table)

        # ====================================================
        # RAPPORT DE STOCK
        # ====================================================

        elif type_rapport == TypeRapport.STOCK:

            produits = ProduitMedical.objects.select_related(
                'catalogue'
            ).order_by('nom')

            total_produits = produits.count()

            stock_total = (
                produits.aggregate(
                    total=Sum('stock')
                )['total']
                or 0
            )

            produits_stock_faible = produits.filter(
                stock__lte=5
            ).count()

            elements.append(
                Paragraph(
                    "Résumé du stock",
                    section_style
                )
            )

            resume = [
                ["Indicateur", "Valeur"],
                [
                    "Nombre de produits",
                    str(total_produits)
                ],
                [
                    "Quantité totale en stock",
                    str(stock_total)
                ],
                [
                    "Produits avec stock faible",
                    str(produits_stock_faible)
                ],
            ]

            table = Table(
                resume,
                colWidths=[100 * mm, 70 * mm]
            )

            table.setStyle(
                TableStyle([
                    (
                        'BACKGROUND',
                        (0, 0),
                        (-1, 0),
                        colors.HexColor('#15803d')
                    ),
                    (
                        'TEXTCOLOR',
                        (0, 0),
                        (-1, 0),
                        colors.white
                    ),
                    (
                        'FONTNAME',
                        (0, 0),
                        (-1, 0),
                        'Helvetica-Bold'
                    ),
                    (
                        'GRID',
                        (0, 0),
                        (-1, -1),
                        0.5,
                        colors.grey
                    ),
                    (
                        'PADDING',
                        (0, 0),
                        (-1, -1),
                        6
                    ),
                ])
            )

            elements.append(table)

            elements.append(Spacer(1, 8 * mm))

            elements.append(
                Paragraph(
                    "État des produits",
                    section_style
                )
            )

            donnees = [
                [
                    "Produit",
                    "Catalogue",
                    "Prix",
                    "Stock"
                ]
            ]

            for produit in produits:

                donnees.append([
                    produit.nom,
                    produit.catalogue.nom,
                    f"{produit.prix} FCFA",
                    str(produit.stock),
                ])

            table = Table(
                donnees,
                colWidths=[
                    65 * mm,
                    45 * mm,
                    35 * mm,
                    25 * mm,
                ],
                repeatRows=1,
            )

            table.setStyle(
                TableStyle([
                    (
                        'BACKGROUND',
                        (0, 0),
                        (-1, 0),
                        colors.HexColor('#15803d')
                    ),
                    (
                        'TEXTCOLOR',
                        (0, 0),
                        (-1, 0),
                        colors.white
                    ),
                    (
                        'FONTNAME',
                        (0, 0),
                        (-1, 0),
                        'Helvetica-Bold'
                    ),
                    (
                        'GRID',
                        (0, 0),
                        (-1, -1),
                        0.4,
                        colors.grey
                    ),
                    (
                        'FONTSIZE',
                        (0, 0),
                        (-1, -1),
                        8
                    ),
                    (
                        'PADDING',
                        (0, 0),
                        (-1, -1),
                        5
                    ),
                ])
            )

            elements.append(table)

        # ====================================================
        # RAPPORT DES APPROVISIONNEMENTS
        # ====================================================

        elif type_rapport == TypeRapport.APPROVISIONNEMENTS:

            queryset = Approvisionnement.objects.all()

            if date_debut:
                queryset = queryset.filter(
                    date_app__gte=date_debut
                )

            if date_fin:
                queryset = queryset.filter(
                    date_app__lte=date_fin
                )

            nombre = queryset.count()

            quantite_totale = (
                queryset.aggregate(
                    total=Sum('quantite_produit')
                )['total']
                or 0
            )

            elements.append(
                Paragraph(
                    "Résumé des approvisionnements",
                    section_style
                )
            )

            resume = [
                ["Indicateur", "Valeur"],
                [
                    "Nombre d'approvisionnements",
                    str(nombre)
                ],
                [
                    "Quantité totale reçue",
                    str(quantite_totale)
                ],
            ]

            table = Table(
                resume,
                colWidths=[100 * mm, 70 * mm]
            )

            table.setStyle(
                TableStyle([
                    (
                        'BACKGROUND',
                        (0, 0),
                        (-1, 0),
                        colors.HexColor('#15803d')
                    ),
                    (
                        'TEXTCOLOR',
                        (0, 0),
                        (-1, 0),
                        colors.white
                    ),
                    (
                        'FONTNAME',
                        (0, 0),
                        (-1, 0),
                        'Helvetica-Bold'
                    ),
                    (
                        'GRID',
                        (0, 0),
                        (-1, -1),
                        0.5,
                        colors.grey
                    ),
                    (
                        'PADDING',
                        (0, 0),
                        (-1, -1),
                        6
                    ),
                ])
            )

            elements.append(table)

            elements.append(Spacer(1, 8 * mm))

            donnees = [
                [
                    "N°",
                    "Date",
                    "Quantité"
                ]
            ]

            for approvisionnement in queryset.order_by(
                '-date_app'
            ):

                donnees.append([
                    str(approvisionnement.id),
                    approvisionnement.date_app.strftime(
                        '%d/%m/%Y'
                    ),
                    str(
                        approvisionnement.quantite_produit
                    ),
                ])

            table = Table(
                donnees,
                colWidths=[
                    35 * mm,
                    65 * mm,
                    50 * mm,
                ],
                repeatRows=1,
            )

            table.setStyle(
                TableStyle([
                    (
                        'BACKGROUND',
                        (0, 0),
                        (-1, 0),
                        colors.HexColor('#15803d')
                    ),
                    (
                        'TEXTCOLOR',
                        (0, 0),
                        (-1, 0),
                        colors.white
                    ),
                    (
                        'GRID',
                        (0, 0),
                        (-1, -1),
                        0.4,
                        colors.grey
                    ),
                    (
                        'PADDING',
                        (0, 0),
                        (-1, -1),
                        5
                    ),
                ])
            )

            elements.append(table)

        # ====================================================
# RAPPORT DES PAIEMENTS
# ====================================================

        elif type_rapport == TypeRapport.PAIEMENTS:

            queryset = Paiement.objects.filter(
                statut=StatutPaiement.REUSSI
            )

            if date_debut:
                queryset = queryset.filter(
                    date_paiement__date__gte=date_debut
                )

            if date_fin:
                queryset = queryset.filter(
                    date_paiement__date__lte=date_fin
                )

            nombre = queryset.count()

            montant_total = (
                queryset.aggregate(
                    total=Sum('montant')
                    )['total']
                    or 0
            )

            elements.append(
                Paragraph(
                    "Résumé des paiements",
                    section_style
                )
            )

            resume = [
                ["Indicateur", "Valeur"],
            [
                "Nombre de paiements réussis",
                str(nombre)
            ],
            [
                "Montant total encaissé",
                f"{montant_total} FCFA"
            ],
            ]

            table = Table(
                resume,
                colWidths=[100 * mm, 70 * mm]
            )

            table.setStyle(
                TableStyle([
                (
                    'BACKGROUND',
                    (0, 0),
                    (-1, 0),
                    colors.HexColor('#7e22ce')
                ),
                (
                    'TEXTCOLOR',
                    (0, 0),
                    (-1, 0),
                    colors.white
                ),
                (
                    'FONTNAME',
                    (0, 0),
                    (-1, 0),
                    'Helvetica-Bold'
                ),
                (
                    'GRID',
                    (0, 0),
                    (-1, -1),
                    0.5,
                    colors.grey
                ),
                (
                    'PADDING',
                    (0, 0),
                    (-1, -1),
                    6
                ),
                ])
            )

            elements.append(table)

            elements.append(Spacer(1, 8 * mm))

            donnees = [
                [
                    "N°",
                    "Commande",
                    "Montant",
                    "Mode",
                    "Statut"
                ]
            ]

            for paiement in queryset.order_by(
                '-date_paiement'
            ):

                donnees.append([
                str(paiement.id),
                str(paiement.commande.id),
                f"{paiement.montant} FCFA",
                paiement.get_mode_paiement_display(),
                paiement.get_statut_display(),
                ])

            table = Table(
                donnees,
                colWidths=[
                    18 * mm,
                    28 * mm,
                    38 * mm,
                    38 * mm,
                    38 * mm,
                ],
                repeatRows=1,
            )

            table.setStyle(
                TableStyle([
                    (
                        'BACKGROUND',
                        (0, 0),
                        (-1, 0),
                        colors.HexColor('#7e22ce')
                    ),
                    (
                        'TEXTCOLOR',
                        (0, 0),
                        (-1, 0),
                        colors.white
                    ),
                    (
                        'FONTNAME',
                        (0, 0),
                        (-1, 0),
                        'Helvetica-Bold'
                    ),
                    (
                        'GRID',
                        (0, 0),
                        (-1, -1),
                        0.4,
                        colors.grey
                    ),
                    (
                        'FONTSIZE',
                        (0, 0),
                        (-1, -1),
                        8
                    ),
                    (
                        'PADDING',
                        (0, 0),
                        (-1, -1),
                        5
                    ),
                ])
            )

            elements.append(table)

        # ====================================================
        # RAPPORT DES FACTURES
        # ====================================================

        elif type_rapport == TypeRapport.FACTURES:

            queryset = Facture.objects.select_related(
                'commande__client'
            )

            if date_debut:
                queryset = queryset.filter(
                    date_emission__gte=date_debut
                )

            if date_fin:
                queryset = queryset.filter(
                    date_emission__lte=date_fin
                )

            nombre = queryset.count()

            montant_total = (
                queryset.aggregate(
                    total=Sum('montant')
                )['total']
                or 0
            )

            elements.append(
                Paragraph(
                    "Résumé des factures",
                    section_style
                )
            )

            resume = [
                ["Indicateur", "Valeur"],
                [
                    "Nombre de factures",
                    str(nombre)
                ],
                [
                    "Montant total facturé",
                    f"{montant_total} FCFA"
                ],
            ]

            table = Table(
                resume,
                colWidths=[100 * mm, 70 * mm]
            )

            table.setStyle(
                TableStyle([
                    (
                        'BACKGROUND',
                        (0, 0),
                        (-1, 0),
                        colors.HexColor('#0891b2')
                    ),
                    (
                        'TEXTCOLOR',
                        (0, 0),
                        (-1, 0),
                        colors.white
                    ),
                    (
                        'FONTNAME',
                        (0, 0),
                        (-1, 0),
                        'Helvetica-Bold'
                    ),
                    (
                        'GRID',
                        (0, 0),
                        (-1, -1),
                        0.5,
                        colors.grey
                    ),
                    (
                        'PADDING',
                        (0, 0),
                        (-1, -1),
                        6
                    ),
                ])
            )

            elements.append(table)

            elements.append(Spacer(1, 8 * mm))

            donnees = [
                [
                    "Facture",
                    "Commande",
                    "Client",
                    "Date",
                    "Montant"
                ]
            ]

            for facture in queryset.order_by(
                '-date_emission'
            ):

                client = (
                    f"{facture.commande.client.prenom} "
                    f"{facture.commande.client.nom}"
                )

                donnees.append([
                    facture.numero,
                    str(facture.commande.id),
                    client,
                    facture.date_emission.strftime(
                        '%d/%m/%Y'
                    ),
                    f"{facture.montant} FCFA",
                ])

            table = Table(
                donnees,
                colWidths=[
                    38 * mm,
                    25 * mm,
                    45 * mm,
                    28 * mm,
                    35 * mm,
                ],
                repeatRows=1,
            )

            table.setStyle(
                TableStyle([
                    (
                        'BACKGROUND',
                        (0, 0),
                        (-1, 0),
                        colors.HexColor('#0891b2')
                    ),
                    (
                        'TEXTCOLOR',
                        (0, 0),
                        (-1, 0),
                        colors.white
                    ),
                    (
                        'FONTNAME',
                        (0, 0),
                        (-1, 0),
                        'Helvetica-Bold'
                    ),
                    (
                        'GRID',
                        (0, 0),
                        (-1, -1),
                        0.4,
                        colors.grey
                    ),
                    (
                        'FONTSIZE',
                        (0, 0),
                        (-1, -1),
                        7
                    ),
                    (
                        'PADDING',
                        (0, 0),
                        (-1, -1),
                        5
                    ),
                ])
            )

            elements.append(table)

        # ====================================================
        # RAPPORT DES CLIENTS
        # ====================================================

        elif type_rapport == TypeRapport.CLIENTS:

            queryset = Utilisateur.objects.filter(
                role=Role.CLIENT
            ).order_by('nom', 'prenom')

            nombre = queryset.count()

            elements.append(
                Paragraph(
                    "Résumé des clients",
                    section_style
                )
            )

            resume = [
                ["Indicateur", "Valeur"],
                [
                    "Nombre total de clients",
                    str(nombre)
                ],
            ]

            table = Table(
                resume,
                colWidths=[100 * mm, 70 * mm]
            )

            table.setStyle(
                TableStyle([
                    (
                        'BACKGROUND',
                        (0, 0),
                        (-1, 0),
                        colors.HexColor('#db2777')
                    ),
                    (
                        'TEXTCOLOR',
                        (0, 0),
                        (-1, 0),
                        colors.white
                    ),
                    (
                        'FONTNAME',
                        (0, 0),
                        (-1, 0),
                        'Helvetica-Bold'
                    ),
                    (
                        'GRID',
                        (0, 0),
                        (-1, -1),
                        0.5,
                        colors.grey
                    ),
                    (
                        'PADDING',
                        (0, 0),
                        (-1, -1),
                        6
                    ),
                ])
            )

            elements.append(table)

            elements.append(Spacer(1, 8 * mm))

            donnees = [
                [
                    "Nom",
                    "Prénom",
                    "Email",
                    "Téléphone"
                ]
            ]

            for client in queryset:

                donnees.append([
                    client.nom,
                    client.prenom,
                    client.email,
                    client.telephone or "—",
                ])

            table = Table(
                donnees,
                colWidths=[
                    35 * mm,
                    35 * mm,
                    65 * mm,
                    35 * mm,
                ],
                repeatRows=1,
            )

            table.setStyle(
                TableStyle([
                    (
                        'BACKGROUND',
                        (0, 0),
                        (-1, 0),
                        colors.HexColor('#db2777')
                    ),
                    (
                        'TEXTCOLOR',
                        (0, 0),
                        (-1, 0),
                        colors.white
                    ),
                    (
                        'FONTNAME',
                        (0, 0),
                        (-1, 0),
                        'Helvetica-Bold'
                    ),
                    (
                        'GRID',
                        (0, 0),
                        (-1, -1),
                        0.4,
                        colors.grey
                    ),
                    (
                        'FONTSIZE',
                        (0, 0),
                        (-1, -1),
                        8
                    ),
                    (
                        'PADDING',
                        (0, 0),
                        (-1, -1),
                        5
                    ),
                ])
            )

            elements.append(table)

        # ====================================================
        # COMMENTAIRES
        # ====================================================

        if commentaires:

            elements.append(Spacer(1, 8 * mm))

            elements.append(
                Paragraph(
                    "Commentaires",
                    section_style
                )
            )

            elements.append(
                Paragraph(
                    commentaires,
                    normal_style
                )
            )

        # ====================================================
        # PIED DE PAGE
        # ====================================================

        elements.append(Spacer(1, 12 * mm))

        elements.append(
            Paragraph(
                "Rapport généré automatiquement par MediDispositif.",
                sous_titre_style
            )
        )

        # ====================================================
        # CONSTRUCTION DU PDF
        # ====================================================

        document.build(elements)

        pdf_data = buffer.getvalue()

        buffer.close()

        # ====================================================
        # ENREGISTREMENT DU RAPPORT
        # ====================================================

        rapport = Rapport.objects.create(
            titre=titre,
            type_rapport=type_rapport,
            periode_debut=date_debut,
            periode_fin=date_fin,
            genere_par=request.user,
            commentaires=commentaires,
        )

        nom_fichier = (
            f"rapport_{type_rapport.lower()}_"
            f"{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        )

        rapport.chemin_acces.save(
            nom_fichier,
            ContentFile(pdf_data),
            save=True,
        )

        # ====================================================
        # RÉPONSE
        # ====================================================

        serializer = RapportDetailSerializer(
            rapport,
            context={'request': request}
        )

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )

        # ========================================================
# TÉLÉCHARGEMENT DU PDF
# ========================================================

    @action(
        detail=True,
        methods=['get'],
        url_path='pdf'
    )
    def pdf(self, request, pk=None):

        print("========== PDF ACTION ==========")
        print("PK REÇU :", pk)

        rapport = self.get_object()

        print("RAPPORT :", rapport)
        print("FICHIER :", rapport.chemin_acces)

        if not rapport.chemin_acces:
            return Response(
                {
                    'detail': "Le fichier PDF de ce rapport n'existe pas."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        try:

            rapport.chemin_acces.open('rb')

            pdf_data = rapport.chemin_acces.read()

            rapport.chemin_acces.close()

            response = HttpResponse(
                pdf_data,
                content_type='application/pdf'
            )

            response['Content-Disposition'] = (
                f'attachment; '
                f'filename="rapport-{rapport.idRapport}.pdf"'
            )

            print("PDF ENVOYÉ AVEC SUCCÈS")

            return response

        except Exception as e:

            print("ERREUR PDF :", str(e))

            return Response(
                {
                    'detail':
                        f"Impossible de récupérer le PDF : {str(e)}"
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

class PeutVoirJournalAudit(BasePermission):
    """
    Le journal d'audit est consultable par :
    - Administrateur
    - Responsable Commercial
    - Gestionnaire de Stock
    """

    def has_permission(self, request, view):
        utilisateur = request.user

        return (
            utilisateur.is_authenticated
            and utilisateur.role in [
                "Administrateur",
                "ResponsableCommercial",
                "GestionnaireDeStock",
            ]
        )

# ============================================================
# JOURNAL D'AUDIT
# ============================================================

class JournalAuditViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = JournalAudit.objects.select_related("utilisateur").all()
    serializer_class = JournalAuditSerializer
    permission_classes = [PeutVoirJournalAudit]

    def get_queryset(self):
        queryset = super().get_queryset()

        module = self.request.query_params.get("module")
        action = self.request.query_params.get("action")
        recherche = self.request.query_params.get("recherche")

        if module:
            queryset = queryset.filter(module=module)

        if action:
            queryset = queryset.filter(action=action)

        if recherche:
            queryset = queryset.filter(
            models.Q(description__icontains=recherche)
            | models.Q(reference__icontains=recherche)
            | models.Q(module__icontains=recherche)
            | models.Q(utilisateur__nom__icontains=recherche)
            | models.Q(utilisateur__prenom__icontains=recherche)
            | models.Q(utilisateur__email__icontains=recherche)
        )

        return queryset
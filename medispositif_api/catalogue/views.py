from datetime import date, timedelta

from django.db.models import Q
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from systeme.audit import enregistrer_audit
from systeme.models import TypeActionAudit

from .models import (
    Approvisionnement,
    Catalogue,
    DetailsApprovisionnement,
    ProduitMedical,
    MouvementStock,
)
from .permissions import (
    EstGestionnaireStock,
    LecturePubliqueEcritureGestionnaire,
)
from .serializers import (
    ApprovisionnementCreateSerializer,
    ApprovisionnementSerializer,
    CatalogueSerializer,
    DetailsApprovisionnementSerializer,
    ProduitMedicalListSerializer,
    ProduitMedicalSerializer,
    MouvementStockSerializer,
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
            queryset = queryset.filter(
                nom__icontains=nom
            )

        if catalogue:
            if catalogue.isdigit():
                queryset = queryset.filter(
                    catalogue_id=catalogue
                )
            else:
                queryset = queryset.filter(
                    catalogue__nom__icontains=catalogue
                )

        if prix_min:
            queryset = queryset.filter(
                prix__gte=prix_min
            )

        if prix_max:
            queryset = queryset.filter(
                prix__lte=prix_max
            )

        return queryset

    # ========================================================
    # ALERTES DE STOCK ET DE PÉREMPTION
    # ========================================================

    @action(
        detail=False,
        methods=['get'],
        url_path='alertes'
    )
    def alertes(self, request):
        """
        Retourne les alertes concernant le stock
        et les dates de péremption.

        Seuls le Gestionnaire de Stock et
        l'Administrateur peuvent consulter ces alertes.
        """

        # ----------------------------------------------------
        # VÉRIFICATION DES DROITS
        # ----------------------------------------------------

        if not request.user.is_authenticated:
            return Response(
                {
                    'detail': 'Authentification requise.'
                },
                status=401,
            )

        if request.user.role not in [
            'GestionnaireDeStock',
            'Administrateur',
        ]:
            return Response(
                {
                    'detail':
                        "Vous n'avez pas l'autorisation de consulter les alertes."
                },
                status=403,
            )

        # ----------------------------------------------------
        # PARAMÈTRES
        # ----------------------------------------------------

        aujourd_hui = date.today()

        # Par défaut : alerte péremption dans les 30 jours
        jours_alerte = 30

        jours_parametre = request.query_params.get(
            'jours'
        )

        if jours_parametre:
            try:
                jours_alerte = int(jours_parametre)

                if jours_alerte < 1:
                    jours_alerte = 30

            except ValueError:
                jours_alerte = 30

        date_limite = aujourd_hui + timedelta(
            days=jours_alerte
        )

        # ----------------------------------------------------
        # ALERTES STOCK FAIBLE
        # ----------------------------------------------------

        seuil_stock = 5

        produits_stock_faible = ProduitMedical.objects.filter(
            stock__lte=seuil_stock
        ).select_related(
            'catalogue'
        ).order_by(
            'stock',
            'nom'
        )

        alertes_stock = []

        for produit in produits_stock_faible:

            alertes_stock.append({
                'type': 'stock_faible',
                'niveau': 'danger',
                'produit': {
                    'id': produit.idProduit,
                    'nom': produit.nom,
                    'stock': produit.stock,
                    'prix': str(produit.prix),
                    'catalogue': produit.catalogue.nom,
                },
                'message': (
                    f"Le stock du produit « {produit.nom} » "
                    f"est faible ({produit.stock} unité(s))."
                ),
            })

        # ----------------------------------------------------
        # ALERTES DE PÉREMPTION
        # ----------------------------------------------------

        details_peremption = (
            DetailsApprovisionnement.objects
            .select_related(
                'produit',
                'produit__catalogue',
                'approvisionnement',
            )
            .filter(
                date_peremption__isnull=False
            )
            .filter(
                date_peremption__lte=date_limite
            )
            .order_by(
                'date_peremption'
            )
        )

        alertes_peremption = []

        for detail in details_peremption:

            date_peremption = detail.date_peremption

            # ------------------------------------------------
            # PRODUIT DÉJÀ PÉRIMÉ
            # ------------------------------------------------

            if date_peremption < aujourd_hui:

                niveau = 'danger'
                type_alerte = 'produit_perime'

                message = (
                    f"Le lot {detail.numero_lot} du produit "
                    f"« {detail.produit.nom} » est périmé."
                )

            # ------------------------------------------------
            # PRODUIT QUI PÉRIME AUJOURD'HUI
            # ------------------------------------------------

            elif date_peremption == aujourd_hui:

                niveau = 'danger'
                type_alerte = 'produit_perime'

                message = (
                    f"Le lot {detail.numero_lot} du produit "
                    f"« {detail.produit.nom} » expire aujourd'hui."
                )

            # ------------------------------------------------
            # PRODUIT BIENTÔT PÉRIMÉ
            # ------------------------------------------------

            else:

                jours_restants = (
                    date_peremption - aujourd_hui
                ).days

                niveau = 'warning'
                type_alerte = 'peremption_proche'

                message = (
                    f"Le lot {detail.numero_lot} du produit "
                    f"« {detail.produit.nom} » expire dans "
                    f"{jours_restants} jour(s)."
                )

            alertes_peremption.append({
                'type': type_alerte,
                'niveau': niveau,
                'produit': {
                    'id': detail.produit.idProduit,
                    'nom': detail.produit.nom,
                    'catalogue': detail.produit.catalogue.nom,
                },
                'lot': {
                    'numero': detail.numero_lot,
                    'quantite': detail.quantite,
                    'date_peremption': (
                        date_peremption.strftime('%Y-%m-%d')
                    ),
                },
                'message': message,
            })

        # ----------------------------------------------------
        # COMPTEURS
        # ----------------------------------------------------

        nombre_stock_faible = len(
            alertes_stock
        )

        nombre_produits_perimes = sum(
            1
            for alerte in alertes_peremption
            if alerte['type'] == 'produit_perime'
        )

        nombre_peremptions_proches = sum(
            1
            for alerte in alertes_peremption
            if alerte['type'] == 'peremption_proche'
        )

        nombre_total = (
            nombre_stock_faible
            + len(alertes_peremption)
        )

        # ----------------------------------------------------
        # RÉPONSE
        # ----------------------------------------------------

        return Response({
            'date_consultation': aujourd_hui.strftime(
                '%Y-%m-%d'
            ),

            'seuil_stock_faible': seuil_stock,

            'jours_alerte_peremption': jours_alerte,

            'resume': {
                'total': nombre_total,
                'stock_faible': nombre_stock_faible,
                'produits_perimes': nombre_produits_perimes,
                'peremptions_proches': nombre_peremptions_proches,
            },

            'alertes_stock': alertes_stock,

            'alertes_peremption': alertes_peremption,
        })

    def perform_create(self, serializer):
        produit = serializer.save()

        enregistrer_audit(
        utilisateur=self.request.user,
        module="Produits",
        action=TypeActionAudit.CREATION,
        description=f"Création du produit médical « {produit.nom} ».",
        reference=f"Produit #{produit.pk}",
    )


    def perform_update(self, serializer):
        produit = serializer.save()

        enregistrer_audit(
        utilisateur=self.request.user,
        module="Produits",
        action=TypeActionAudit.MODIFICATION,
        description=f"Modification du produit médical « {produit.nom} ».",
        reference=f"Produit #{produit.pk}",
    )


    def perform_destroy(self, instance):
        nom_produit = instance.nom
        produit_id = instance.pk

        instance.delete()

        enregistrer_audit(
            utilisateur=self.request.user,
            module="Produits",
            action=TypeActionAudit.SUPPRESSION,
        description=f"Suppression du produit médical « {nom_produit} ».",
        reference=f"Produit #{produit_id}",
    )


class ApprovisionnementViewSet(viewsets.ModelViewSet):
    """CRUD des approvisionnements — réservé au Gestionnaire de Stock."""

    queryset = Approvisionnement.objects.prefetch_related(
        'details__produit'
    ).all()

    permission_classes = [EstGestionnaireStock]

    def get_serializer_class(self):
        if self.action == 'create':
            return ApprovisionnementCreateSerializer

        return ApprovisionnementSerializer

    @action(
        detail=True,
        methods=['post'],
        url_path='ajouter-detail'
    )
    def ajouter_detail(self, request, pk=None):
        """Ajoute un détail à un approvisionnement existant."""

        approvisionnement = self.get_object()

        serializer = DetailsApprovisionnementSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        detail = DetailsApprovisionnement.objects.create(
            approvisionnement=approvisionnement,
            **serializer.validated_data,
        )

        return Response(
            DetailsApprovisionnementSerializer(
                detail
            ).data,
            status=201,
        )

    def perform_create(self, serializer):
        approvisionnement = serializer.save()

        enregistrer_audit(
        utilisateur=self.request.user,
        module="Approvisionnements",
        action=TypeActionAudit.CREATION,
        description=f"Création de l'approvisionnement #{approvisionnement.pk}.",
        reference=f"Approvisionnement #{approvisionnement.pk}",
    )
    def perform_destroy(self, instance):
        approvisionnement_id = instance.pk

        instance.delete()

        enregistrer_audit(
        utilisateur=self.request.user,
        module="Approvisionnements",
        action=TypeActionAudit.SUPPRESSION,
        description=f"Suppression de l'approvisionnement #{approvisionnement_id}.",
        reference=f"Approvisionnement #{approvisionnement_id}",
    )


class DetailsApprovisionnementViewSet(viewsets.ModelViewSet):
    """CRUD des détails d'approvisionnement — réservé au Gestionnaire de Stock."""

    queryset = DetailsApprovisionnement.objects.select_related(
        'produit',
        'approvisionnement'
    ).all()

    serializer_class = DetailsApprovisionnementSerializer
    permission_classes = [EstGestionnaireStock]

    def get_queryset(self):
        queryset = super().get_queryset()

        appro_id = self.request.query_params.get(
            'approvisionnement'
        )

        if appro_id:
            queryset = queryset.filter(
                approvisionnement_id=appro_id
            )

        return queryset

class MouvementStockViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Consultation de l'historique des mouvements de stock.

    Accessible au Gestionnaire de Stock et à l'Administrateur.
    Les mouvements sont créés automatiquement par le système.
    """

    queryset = MouvementStock.objects.select_related(
        'produit'
    ).all()

    serializer_class = MouvementStockSerializer
    permission_classes = [EstGestionnaireStock]

    def get_queryset(self):
        queryset = super().get_queryset()

        produit_id = self.request.query_params.get('produit')
        type_mouvement = self.request.query_params.get('type')

        if produit_id:
            queryset = queryset.filter(
                produit_id=produit_id
            )

        if type_mouvement:
            queryset = queryset.filter(
                type_mouvement=type_mouvement
            )

        return queryset
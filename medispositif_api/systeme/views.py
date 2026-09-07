from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.core.files.base import ContentFile
from django.http import FileResponse
from django.template.loader import render_to_string
from django.utils import timezone
from datetime import date

from authentication.models import Role
from .models import ParametreSysteme, Rapport, TypeRapport
from .permissions import EstAdministrateur, LectureTousEcritureAdministrateur
from .serializers import (
    ParametreSystemeCreateSerializer,
    ParametreSystemeSerializer,
    RapportCreateSerializer,
    RapportDetailSerializer,
    RapportListSerializer,
)


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
                status=400,
            )
        try:
            parametre = ParametreSysteme.objects.get(nom=nom)
            serializer = self.get_serializer(parametre)
            return Response(serializer.data)
        except ParametreSysteme.DoesNotExist:
            return Response(
                {'error': f"Paramètre '{nom}' non trouvé."},
                status=404,
            )


class RapportViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour la gestion des rapports.
    - Lecture : tous les utilisateurs authentifiés
    - Création/Modification/Suppression : Administrateur uniquement
    """

    queryset = Rapport.objects.select_related('genere_par').all()
    permission_classes = [LectureTousEcritureAdministrateur]

    def get_serializer_class(self):
        if self.action == 'list':
            return RapportListSerializer
        elif self.action == 'create':
            return RapportCreateSerializer
        return RapportDetailSerializer

    def perform_create(self, serializer):
        """Associe l'administrateur et génère le fichier détaillé des ventes."""
        from ventes.models import Commande

        rapport = serializer.save(
            genere_par=self.request.user,
            type_rapport=TypeRapport.VENTES,
        )
        commandes = Commande.objects.select_related('client').prefetch_related(
            'lignes__produit'
        ).all()
        if rapport.periode_debut:
            commandes = commandes.filter(date_commande__date__gte=rapport.periode_debut)
        if rapport.periode_fin:
            commandes = commandes.filter(date_commande__date__lte=rapport.periode_fin)

        html = render_to_string('rapports/ventes.html', {
            'rapport': rapport,
            'commandes': commandes,
            'total_commandes': commandes.count(),
            'total_ventes': sum((commande.montant_total for commande in commandes), 0),
            'date_generation': timezone.localtime(),
        })
        filename = f'rapport-ventes-{rapport.pk}.html'
        rapport.chemin_acces.save(filename, ContentFile(html.encode('utf-8')), save=True)

    def get_queryset(self):
        queryset = super().get_queryset()
        queryset = queryset.filter(type_rapport=TypeRapport.VENTES)

        type_rapport = self.request.query_params.get('type')
        if type_rapport:
            queryset = queryset.filter(type_rapport=type_rapport)

        date_debut = self.request.query_params.get('date_debut')
        date_fin = self.request.query_params.get('date_fin')
        if date_debut:
            queryset = queryset.filter(date_generation__gte=date_debut)
        if date_fin:
            queryset = queryset.filter(date_generation__lte=date_fin)

        return queryset

    @action(detail=False, methods=['get'], url_path='types')
    def types_rapports(self, request):
        """Retourne la liste des types de rapports disponibles."""
        types = [{'value': TypeRapport.VENTES, 'label': TypeRapport.VENTES.label}]
        return Response(types)

    @action(detail=True, methods=['get'], url_path='telecharger', permission_classes=[EstAdministrateur])
    def telecharger(self, request, pk=None):
        rapport = self.get_object()
        if not rapport.chemin_acces:
            return Response({'error': 'Aucun fichier n’est disponible pour ce rapport.'}, status=404)
        rapport.chemin_acces.open('rb')
        return FileResponse(
            rapport.chemin_acces,
            as_attachment=True,
            filename=f'rapport-ventes-{rapport.pk}.html',
        )

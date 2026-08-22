from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

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
        """Associe automatiquement l'utilisateur administrateur au rapport."""
        print(f"User role: {self.request.user.role}")
        print(f"User: {self.request.user}")
        
        if self.request.user.role != Role.ADMINISTRATEUR:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Seuls les administrateurs peuvent créer des rapports.")
        
        print("Saving report with generated_by user")
        serializer.save(genere_par=self.request.user)
        print("Report saved successfully")

    def get_queryset(self):
        queryset = super().get_queryset()

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
        types = [{'value': key, 'label': label} for key, label in TypeRapport.choices]
        return Response(types)

from rest_framework.permissions import BasePermission, SAFE_METHODS

from authentication.models import Role


class EstGestionnaireStock(BasePermission):
    """Autorise uniquement le Gestionnaire de Stock et l'Administrateur."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in (Role.GESTIONNAIRE_STOCK, Role.ADMINISTRATEUR)


class LecturePubliqueEcritureGestionnaire(BasePermission):
    """
    Lecture publique (GET, HEAD, OPTIONS) pour la recherche de produits.
    Écriture réservée au Gestionnaire de Stock et à l'Administrateur.
    """

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.role in (Role.GESTIONNAIRE_STOCK, Role.ADMINISTRATEUR)

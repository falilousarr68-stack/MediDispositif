from rest_framework import permissions

from authentication.models import Role


class EstAdministrateur(permissions.BasePermission):
    """
    Permission réservée exclusivement à l'Administrateur.
    Utilisée pour la gestion des paramètres système et des rapports.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == Role.ADMINISTRATEUR
        )


class LectureTousEcritureAdministrateur(permissions.BasePermission):
    """
    Permission accordée en lecture à tous les utilisateurs authentifiés,
    mais en écriture uniquement à l'Administrateur.
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.role == Role.ADMINISTRATEUR

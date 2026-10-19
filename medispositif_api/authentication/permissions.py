from rest_framework import permissions

from .models import Role


class EstAdministrateur(permissions.BasePermission):
    """
    Autorise uniquement les utilisateurs ayant le rôle Administrateur.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == Role.ADMINISTRATEUR
        )
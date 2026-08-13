from rest_framework import permissions


class EstAdministrateur(permissions.BasePermission):
    """
    Permission qui vérifie si l'utilisateur connecté est un administrateur.
    """

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == 'Administrateur'
        )

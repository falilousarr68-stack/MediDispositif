from rest_framework import permissions

from authentication.models import Role, Utilisateur


class EstClientOuVendeurOuResponsable(permissions.BasePermission):
    """
    Permission accordée aux Clients, Vendeurs, Responsables Commerciaux et Administrateurs.
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in [
            Role.CLIENT,
            Role.VENDEUR,
            Role.RESPONSABLE_COMMERCIAL,
            Role.ADMINISTRATEUR,
        ]


class EstResponsableCommercial(permissions.BasePermission):
    """
    Permission réservée au Responsable Commercial.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == Role.RESPONSABLE_COMMERCIAL
        )


class EstVendeurOuResponsable(permissions.BasePermission):
    """
    Permission accordée aux Vendeurs, Responsables Commerciaux et Administrateurs.
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in [
            Role.VENDEUR,
            Role.RESPONSABLE_COMMERCIAL,
            Role.ADMINISTRATEUR,
        ]


class EstProprietaireCommandeOuResponsable(permissions.BasePermission):
    """
    Permission accordée au propriétaire de la commande ou au Responsable Commercial.
    """

    def has_object_permission(self, request, view, obj):
        if request.user.role == Role.RESPONSABLE_COMMERCIAL:
            return True
        return obj.client == request.user


class EstProprietaireOuVendeurOuResponsable(permissions.BasePermission):
    """
    Permission accordée au propriétaire de la commande, Vendeur, Responsable Commercial ou Administrateur.
    """

    def has_permission(self, request, view):
        # For list action, all authenticated users can see their own orders (filtered by queryset)
        if view.action == 'list':
            return request.user and request.user.is_authenticated
        return True

    def has_object_permission(self, request, view, obj):
        if request.user.role in [
            Role.VENDEUR,
            Role.RESPONSABLE_COMMERCIAL,
            Role.ADMINISTRATEUR,
        ]:
            return True
        return obj.client == request.user


class PeutValiderCommande(permissions.BasePermission):
    """
    Permission pour valider une commande : réservée au Vendeur,
    Responsable Commercial et Administrateur.
    """

    def has_object_permission(self, request, view, obj):
        return (
            request.user.is_authenticated
            and request.user.role in [
                Role.VENDEUR,
                Role.RESPONSABLE_COMMERCIAL,
                Role.ADMINISTRATEUR,
            ]
        )


class PeutAnnulerCommande(permissions.BasePermission):
    """
    Permission pour annuler une commande :
    - Client : peut annuler ses propres commandes en cours
    - Responsable Commercial : peut annuler n'importe quelle commande
    - Administrateur : peut annuler n'importe quelle commande
    """

    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False

        if request.user.role in [Role.RESPONSABLE_COMMERCIAL, Role.ADMINISTRATEUR]:
            return True

        if request.user.role == Role.CLIENT and obj.client == request.user:
            return obj.statut == 'EnCours'

        return False

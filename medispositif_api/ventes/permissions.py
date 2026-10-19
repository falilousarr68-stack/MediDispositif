from rest_framework import permissions

from authentication.models import Role, Utilisateur
from rest_framework import permissions
from authentication.models import Role


class EstAdministrateur(permissions.BasePermission):
    """
    Autorise uniquement l'Administrateur.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == Role.ADMINISTRATEUR
        )

class EstClient(permissions.BasePermission):
    """
    Autorise uniquement le Client.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == Role.CLIENT
        )

class LecturePaiementClientOuAdmin(permissions.BasePermission):
    """
    Autorise la consultation des paiements :
    - Client
    - Administrateur
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in [
                Role.CLIENT,
                Role.ADMINISTRATEUR,
            ]
        )


class EstClientOuVendeurOuResponsable(permissions.BasePermission):
    """
    Permission accordée aux Clients, Vendeurs et Responsables Commerciaux.
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in [
            Role.CLIENT,
            Role.VENDEUR,
            Role.RESPONSABLE_COMMERCIAL,
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

class LectureLivraison(permissions.BasePermission):
    """
    Autorise la consultation des livraisons :
    - Client
    - Gestionnaire de Stock
    - Responsable Commercial
    - Administrateur
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in [
                Role.CLIENT,
                Role.GESTIONNAIRE_STOCK,
                Role.RESPONSABLE_COMMERCIAL,
                Role.ADMINISTRATEUR,
            ]
        )


class EstGestionnaireStockOuResponsable(permissions.BasePermission):
    """
    Autorise la gestion des livraisons :
    - Gestionnaire de Stock
    - Responsable Commercial
    - Administrateur
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in [
                Role.GESTIONNAIRE_STOCK,
                Role.RESPONSABLE_COMMERCIAL,
                Role.ADMINISTRATEUR,
            ]
        )


class EstVendeurOuResponsable(permissions.BasePermission):
    """
    Permission accordée aux Vendeurs et Responsables Commerciaux.
    """

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in [
            Role.VENDEUR,
            Role.RESPONSABLE_COMMERCIAL,
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
    Permission accordée :
    - au propriétaire de la commande ;
    - au Vendeur ;
    - au Responsable Commercial ;
    - à l'Administrateur.
    """

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in [
                Role.CLIENT,
                Role.VENDEUR,
                Role.RESPONSABLE_COMMERCIAL,
                Role.ADMINISTRATEUR,
            ]
        )

    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False

        if request.user.role in [
            Role.ADMINISTRATEUR,
            Role.VENDEUR,
            Role.RESPONSABLE_COMMERCIAL,
        ]:
            return True

        return obj.client == request.user


class PeutValiderCommande(permissions.BasePermission):
    """
    Permission pour valider une commande : réservée au Responsable Commercial.
    """

    def has_object_permission(self, request, view, obj):
        return (
            request.user.is_authenticated
            and request.user.role == Role.RESPONSABLE_COMMERCIAL
        )


class PeutAnnulerCommande(permissions.BasePermission):
    """
    Permission pour annuler une commande :
    - Client : peut annuler ses propres commandes en cours
    - Responsable Commercial : peut annuler n'importe quelle commande
    """

    def has_object_permission(self, request, view, obj):
        if not request.user.is_authenticated:
            return False

        if request.user.role == Role.RESPONSABLE_COMMERCIAL:
            return True

        if request.user.role == Role.CLIENT and obj.client == request.user:
            return obj.statut == 'EnCours'

        return False

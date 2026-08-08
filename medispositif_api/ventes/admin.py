from django.contrib import admin

from .models import Commande, Facture, LigneCommande, Paiement


@admin.register(LigneCommande)
class LigneCommandeAdmin(admin.ModelAdmin):
    list_display = ['commande', 'produit', 'quantite', 'prix_unitaire', 'montant']
    list_filter = ['commande', 'produit']
    search_fields = ['commande__pk', 'produit__nom']
    readonly_fields = ['montant']


class LigneCommandeInline(admin.TabularInline):
    model = LigneCommande
    extra = 0
    readonly_fields = ['montant']


@admin.register(Commande)
class CommandeAdmin(admin.ModelAdmin):
    list_display = ['idCommande', 'client', 'date_commande', 'montant_total', 'statut']
    list_filter = ['statut', 'date_commande']
    search_fields = ['client__nom', 'client__email', 'idCommande']
    readonly_fields = ['date_commande', 'montant_total']
    inlines = [LigneCommandeInline]


@admin.register(Paiement)
class PaiementAdmin(admin.ModelAdmin):
    list_display = ['idPaiement', 'commande', 'montant', 'date_paiement', 'mode_paiement']
    list_filter = ['mode_paiement', 'date_paiement']
    search_fields = ['commande__pk', 'idPaiement']


@admin.register(Facture)
class FactureAdmin(admin.ModelAdmin):
    list_display = ['numero', 'commande', 'date_emission', 'montant']
    list_filter = ['date_emission']
    search_fields = ['numero', 'commande__pk']
    readonly_fields = ['numero', 'date_emission', 'montant']

from django.contrib import admin

from .models import Approvisionnement, Catalogue, DetailsApprovisionnement, ProduitMedical


class DetailsApprovisionnementInline(admin.TabularInline):
    model = DetailsApprovisionnement
    extra = 1
    readonly_fields = ('montant',)


@admin.register(Catalogue)
class CatalogueAdmin(admin.ModelAdmin):
    list_display = ('id', 'nom')
    search_fields = ('nom',)


@admin.register(ProduitMedical)
class ProduitMedicalAdmin(admin.ModelAdmin):
    list_display = ('id', 'nom', 'catalogue', 'prix', 'stock')
    list_filter = ('catalogue',)
    search_fields = ('nom',)
    readonly_fields = ('stock',)


@admin.register(Approvisionnement)
class ApprovisionnementAdmin(admin.ModelAdmin):
    list_display = ('id', 'date_app', 'quantite_produit')
    readonly_fields = ('quantite_produit',)
    inlines = [DetailsApprovisionnementInline]


@admin.register(DetailsApprovisionnement)
class DetailsApprovisionnementAdmin(admin.ModelAdmin):
    list_display = ('id', 'produit', 'quantite', 'montant', 'numero_lot', 'date_peremption')
    readonly_fields = ('montant',)

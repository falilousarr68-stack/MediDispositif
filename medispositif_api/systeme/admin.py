from django.contrib import admin

from authentication.models import Role, Utilisateur
from .models import ParametreSysteme, Rapport


@admin.register(ParametreSysteme)
class ParametreSystemeAdmin(admin.ModelAdmin):
    list_display = ['nom', 'valeur', 'description', 'date_modification']
    list_filter = ['date_modification']
    search_fields = ['nom', 'description']
    readonly_fields = ['date_modification']


@admin.register(Rapport)
class RapportAdmin(admin.ModelAdmin):
    list_display = ['titre', 'type_rapport', 'date_generation', 'periode_debut', 'periode_fin', 'genere_par']
    list_filter = ['type_rapport', 'date_generation']
    search_fields = ['titre', 'commentaires']
    readonly_fields = ['date_generation', 'chemin_acces']
    date_hierarchy = 'date_generation'

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == 'genere_par':
            kwargs['queryset'] = Utilisateur.objects.filter(role=Role.ADMINISTRATEUR)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

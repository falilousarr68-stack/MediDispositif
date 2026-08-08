from django.db import models

from authentication.models import Role


class TypeRapport(models.TextChoices):
    """Énumération des types de rapports générés par le système."""

    VENTES = 'Ventes', 'Rapport des ventes'
    STOCK = 'Stock', 'Rapport de stock'
    APPROVISIONNEMENTS = 'Approvisionnements', "Rapport des approvisionnements"
    PAIEMENTS = 'Paiements', 'Rapport des paiements'
    FACTURES = 'Factures', 'Rapport des factures'
    CLIENTS = 'Clients', 'Rapport des clients'


class ParametreSysteme(models.Model):
    """
    Paramètres de configuration du système.
    Permet de stocker des informations globales comme l'adresse de l'entreprise,
    les informations de contact, les taux de TVA, etc.
    """

    nom = models.CharField(
        max_length=100,
        unique=True,
        verbose_name='Nom du paramètre',
        help_text='Identifiant unique du paramètre (ex: adresse_entreprise, taux_tva)',
    )
    valeur = models.TextField(
        verbose_name='Valeur',
        help_text='Valeur du paramètre (texte, JSON, etc.)',
    )
    description = models.TextField(
        blank=True,
        verbose_name='Description',
        help_text='Description du rôle de ce paramètre',
    )
    date_modification = models.DateTimeField(
        auto_now=True,
        verbose_name='Date de modification',
    )

    class Meta:
        verbose_name = 'Paramètre système'
        verbose_name_plural = 'Paramètres système'
        ordering = ['nom']

    def __str__(self):
        return f'{self.nom}: {self.valeur}'


class Rapport(models.Model):
    """
    Rapports générés par le système.
    Stocke les métadonnées des rapports (ventes, stock, etc.) générés périodiquement.
    """

    titre = models.CharField(
        max_length=200,
        verbose_name='Titre du rapport',
    )
    date_generation = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Date de génération',
    )
    type_rapport = models.CharField(
        max_length=30,
        choices=TypeRapport.choices,
        verbose_name='Type de rapport',
    )
    chemin_acces = models.FileField(
        upload_to='rapports/%Y/%m/%d/',
        verbose_name="Chemin d'accès",
        help_text='Fichier PDF/Excel généré',
        blank=True,
        null=True,
    )
    periode_debut = models.DateField(
        null=True,
        blank=True,
        verbose_name='Début de période',
        help_text='Date de début de la période couverte par le rapport',
    )
    periode_fin = models.DateField(
        null=True,
        blank=True,
        verbose_name='Fin de période',
        help_text='Date de fin de la période couverte par le rapport',
    )
    genere_par = models.ForeignKey(
        'authentication.Utilisateur',
        on_delete=models.SET_NULL,
        null=True,
        related_name='rapports_genres',
        verbose_name='Généré par',
        limit_choices_to={'role': Role.ADMINISTRATEUR},
    )
    commentaires = models.TextField(
        blank=True,
        verbose_name='Commentaires',
        help_text='Notes ou observations sur le rapport',
    )

    class Meta:
        verbose_name = 'Rapport'
        verbose_name_plural = 'Rapports'
        ordering = ['-date_generation']

    def __str__(self):
        return f'{self.titre} - {self.date_generation.strftime("%d/%m/%Y %H:%M")}'

    @property
    def idRapport(self):
        """Alias conforme au diagramme UML pour l'identifiant de rapport."""
        return self.pk

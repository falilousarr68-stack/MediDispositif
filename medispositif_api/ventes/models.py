from decimal import Decimal

from django.db import models
from django.db.models import Sum
from django.db.models.signals import post_save
from django.dispatch import receiver

from authentication.models import Role, Utilisateur
from catalogue.models import ProduitMedical


class StatutCommande(models.TextChoices):
    """Énumération des statuts de commande conforme au diagramme de classes UML."""

    EN_COURS = 'EnCours', 'En cours'
    VALIDEE = 'Validee', 'Validée'
    ANNULEE = 'Annulee', 'Annulée'


class ModePaiement(models.TextChoices):
    """Énumération des modes de paiement."""

    ESPECES = 'Especes', 'Espèces'
    CARTE = 'Carte', 'Carte bancaire'
    MOBILE_MONEY = 'MobileMoney', 'Mobile Money'
    CHEQUE = 'Cheque', 'Chèque'


class Commande(models.Model):
    """
    Commande d'un client.
    Le montant total est calculé automatiquement à partir des lignes de commande.
    """

    client = models.ForeignKey(
        Utilisateur,
        on_delete=models.PROTECT,
        related_name='commandes',
        limit_choices_to={'role': Role.CLIENT},
        verbose_name='Client',
    )
    date_commande = models.DateTimeField(auto_now_add=True, verbose_name='Date de commande')
    montant_total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00'),
        editable=False,
        verbose_name='Montant total',
    )
    statut = models.CharField(
        max_length=20,
        choices=StatutCommande.choices,
        default=StatutCommande.EN_COURS,
        verbose_name='Statut de la commande',
    )
    motif_annulation = models.TextField(
        blank=True,
        verbose_name="Motif d'annulation",
        help_text="Obligatoire lors de l'annulation par le Responsable Commercial.",
    )

    class Meta:
        verbose_name = 'Commande'
        verbose_name_plural = 'Commandes'
        ordering = ['-date_commande']

    def __str__(self):
        return f'Commande #{self.pk} - {self.client} ({self.get_statut_display()})'

    @property
    def idCommande(self):
        """Alias conforme au diagramme UML pour l'identifiant de commande."""
        return self.pk

    def calculer_montant_total(self):
        """Recalcule le montant total à partir des lignes de commande."""
        total = self.lignes.aggregate(total=Sum('montant'))['total'] or Decimal('0.00')
        self.montant_total = total
        self.save(update_fields=['montant_total'])

    def valider_commande(self):
        """
        Valide la commande et décrémente le stock des produits.
        Vérifie la disponibilité du stock avant validation.
        """
        if self.statut != StatutCommande.EN_COURS:
            raise ValueError("Seules les commandes en cours peuvent être validées.")

        for ligne in self.lignes.all():
            if ligne.produit.stock < ligne.quantite:
                raise ValueError(
                    f"Stock insuffisant pour {ligne.produit.nom}. "
                    f"Disponible: {ligne.produit.stock}, Demandé: {ligne.quantite}"
                )

        for ligne in self.lignes.all():
            ligne.produit.stock -= ligne.quantite
            ligne.produit.save(update_fields=['stock'])

        self.statut = StatutCommande.VALIDEE
        self.save(update_fields=['statut'])

    def annuler_commande(self, motif):
        """
        Annule la commande avec un motif obligatoire.
        Remet le stock en place si la commande était validée.
        """
        if self.statut == StatutCommande.ANNULEE:
            raise ValueError("Cette commande est déjà annulée.")

        if self.statut == StatutCommande.VALIDEE:
            for ligne in self.lignes.all():
                ligne.produit.stock += ligne.quantite
                ligne.produit.save(update_fields=['stock'])

        self.statut = StatutCommande.ANNULEE
        self.motif_annulation = motif
        self.save(update_fields=['statut', 'motif_annulation'])


class LigneCommande(models.Model):
    """
    Ligne de commande détail.
    Le montant est calculé automatiquement (quantité × prix unitaire).
    """

    commande = models.ForeignKey(
        Commande,
        on_delete=models.CASCADE,
        related_name='lignes',
        verbose_name='Commande',
    )
    produit = models.ForeignKey(
        ProduitMedical,
        on_delete=models.PROTECT,
        related_name='lignes_commande',
        verbose_name='Produit médical',
    )
    quantite = models.PositiveIntegerField(verbose_name='Quantité')
    prix_unitaire = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Prix unitaire',
    )
    montant = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        editable=False,
        verbose_name='Montant',
    )

    class Meta:
        verbose_name = 'Ligne de commande'
        verbose_name_plural = 'Lignes de commande'
        unique_together = ('commande', 'produit')

    def __str__(self):
        return f'{self.produit.nom} x{self.quantite} - {self.commande}'

    def save(self, *args, **kwargs):
        self.montant = Decimal(self.quantite) * self.prix_unitaire
        super().save(*args, **kwargs)

        self.commande.calculer_montant_total()

    def delete(self, *args, **kwargs):
        commande = self.commande
        super().delete(*args, **kwargs)
        commande.calculer_montant_total()


@receiver(post_save, sender=LigneCommande)
def mettre_a_jour_montant_total(sender, instance, **kwargs):
    """Signal pour mettre à jour le montant total de la commande après modification."""
    instance.commande.calculer_montant_total()


class Paiement(models.Model):
    """Enregistrement d'un paiement pour une commande."""

    commande = models.ForeignKey(
        Commande,
        on_delete=models.PROTECT,
        related_name='paiements',
        verbose_name='Commande',
    )
    montant = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='Montant payé',
    )
    date_paiement = models.DateTimeField(auto_now_add=True, verbose_name='Date de paiement')
    mode_paiement = models.CharField(
        max_length=20,
        choices=ModePaiement.choices,
        verbose_name='Mode de paiement',
    )

    class Meta:
        verbose_name = 'Paiement'
        verbose_name_plural = 'Paiements'
        ordering = ['-date_paiement']

    def __str__(self):
        return f'Paiement #{self.pk} - {self.montant} FCFA ({self.get_mode_paiement_display()})'

    @property
    def idPaiement(self):
        """Alias conforme au diagramme UML pour l'identifiant de paiement."""
        return self.pk


class Facture(models.Model):
    """
    Facture générée pour une commande validée.
    Le numéro est généré automatiquement.
    """

    commande = models.OneToOneField(
        Commande,
        on_delete=models.PROTECT,
        related_name='facture',
        verbose_name='Commande',
    )
    numero = models.CharField(max_length=50, unique=True, verbose_name='Numéro de facture')
    date_emission = models.DateField(auto_now_add=True, verbose_name="Date d'émission")
    montant = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='Montant facturé',
    )

    class Meta:
        verbose_name = 'Facture'
        verbose_name_plural = 'Factures'
        ordering = ['-date_emission']

    def __str__(self):
        return f'Facture {self.numero} - {self.montant} FCFA'

    def save(self, *args, **kwargs):
        if not self.numero:
            self.numero = self.generer_numero()
        if not self.montant:
            self.montant = self.commande.montant_total
        super().save(*args, **kwargs)

    def generer_numero(self):
        """Génère un numéro de facture unique basé sur la date et un compteur."""
        from datetime import datetime

        date_str = datetime.now().strftime('%Y%m%d')
        compteur = Facture.objects.filter(numero__startswith=f'FAC-{date_str}').count() + 1
        return f'FAC-{date_str}-{compteur:04d}'

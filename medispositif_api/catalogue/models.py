from decimal import Decimal

from django.db import models
from django.db.models import Sum


class Catalogue(models.Model):
    """Regroupe les produits médicaux par catégorie."""

    nom = models.CharField(max_length=150, unique=True, verbose_name='Nom du catalogue')

    class Meta:
        verbose_name = 'Catalogue'
        verbose_name_plural = 'Catalogues'
        ordering = ['nom']

    def __str__(self):
        return self.nom

    @property
    def idCatalogue(self):
        return self.pk


class ProduitMedical(models.Model):
    """Produit médical disponible à la vente."""

    catalogue = models.ForeignKey(
        Catalogue,
        on_delete=models.PROTECT,
        related_name='produits',
        verbose_name='Catalogue',
    )
    nom = models.CharField(max_length=200, verbose_name='Nom du produit')
    description = models.TextField(blank=True, verbose_name='Description')
    prix = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Prix de vente',
    )
    stock = models.PositiveIntegerField(default=0, verbose_name='Stock disponible')

    class Meta:
        verbose_name = 'Produit médical'
        verbose_name_plural = 'Produits médicaux'
        ordering = ['nom']
        unique_together = ('catalogue', 'nom')

    def __str__(self):
        return f'{self.nom} (stock: {self.stock})'

    @property
    def idProduit(self):
        return self.pk


class Approvisionnement(models.Model):
    """Enregistre une opération d'approvisionnement en stock."""

    date_app = models.DateField(auto_now_add=True, verbose_name="Date d'approvisionnement")
    quantite_produit = models.PositiveIntegerField(
        default=0,
        verbose_name='Quantité totale de produits',
    )

    class Meta:
        verbose_name = 'Approvisionnement'
        verbose_name_plural = 'Approvisionnements'
        ordering = ['-date_app']

    def __str__(self):
        return f'Approvisionnement #{self.pk} - {self.date_app}'

    @property
    def idApp(self):
        return self.pk

    def recalculer_quantite_totale(self):
        """Recalcule la quantité totale à partir des détails."""
        total = self.details.aggregate(total=Sum('quantite'))['total'] or 0
        self.quantite_produit = total
        self.save(update_fields=['quantite_produit'])


class DetailsApprovisionnement(models.Model):
    """
    Détail d'un approvisionnement pour un produit donné.
    Met à jour automatiquement le stock et calcule le montant.
    """

    approvisionnement = models.ForeignKey(
        Approvisionnement,
        on_delete=models.CASCADE,
        related_name='details',
        verbose_name='Approvisionnement',
    )
    produit = models.ForeignKey(
        ProduitMedical,
        on_delete=models.PROTECT,
        related_name='details_approvisionnement',
        verbose_name='Produit médical',
    )
    quantite = models.PositiveIntegerField(verbose_name='Quantité')
    prix_unitaire_achat = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Prix unitaire d'achat",
    )
    montant = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        editable=False,
        verbose_name='Montant',
    )
    date_peremption = models.DateField(verbose_name='Date de péremption')
    numero_lot = models.CharField(max_length=50, verbose_name='Numéro de lot')

    class Meta:
        verbose_name = "Détail d'approvisionnement"
        verbose_name_plural = "Détails d'approvisionnement"
        ordering = ['-date_peremption']

    def __str__(self):
        return f'{self.produit.nom} x{self.quantite} (lot {self.numero_lot})'

    @property
    def idDetailApp(self):
        return self.pk

    def save(self, *args, **kwargs):
        self.montant = Decimal(self.quantite) * self.prix_unitaire_achat

        if self.pk:
            ancien = DetailsApprovisionnement.objects.get(pk=self.pk)
            difference = self.quantite - ancien.quantite
        else:
            difference = self.quantite

        super().save(*args, **kwargs)

        if difference != 0:
            self.produit.stock = max(0, self.produit.stock + difference)
            self.produit.save(update_fields=['stock'])

        self.approvisionnement.recalculer_quantite_totale()

    def delete(self, *args, **kwargs):
        approvisionnement = self.approvisionnement
        produit = self.produit
        quantite = self.quantite

        super().delete(*args, **kwargs)

        produit.stock = max(0, produit.stock - quantite)
        produit.save(update_fields=['stock'])
        approvisionnement.recalculer_quantite_totale()

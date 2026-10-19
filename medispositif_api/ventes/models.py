from decimal import Decimal

from django.db import models
from django.db.models import Sum
from django.db.models.signals import post_save
from django.dispatch import receiver
from datetime import date

from authentication.models import Role, Utilisateur
from catalogue.models import ProduitMedical


class StatutCommande(models.TextChoices):
    """Énumération des statuts de commande conforme au diagramme de classes UML."""

    EN_COURS = 'EnCours', 'En cours'
    VALIDEE = 'Validee', 'Validée'
    ANNULEE = 'Annulee', 'Annulée'


class ModePaiement(models.TextChoices):
    WAVE = 'Wave', 'Wave'
    ORANGE_MONEY = 'OrangeMoney', 'Orange Money'
    CARTE = 'Carte', 'Carte bancaire'

class StatutPaiement(models.TextChoices):
    EN_ATTENTE = 'EnAttente', 'En attente'
    REUSSI = 'Reussi', 'Réussi'
    ECHOUE = 'Echoue', 'Échoué'
    ANNULE = 'Annule', 'Annulé'

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

    frais_livraison = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=Decimal('0.00'),
        verbose_name='Frais de livraison',
    )
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
        """Recalcule le montant total à partir des lignes de commande
        et des frais de livraison.
        """

        total_produits = (
            self.lignes.aggregate(
                total=Sum('montant')
            )['total']
            or Decimal('0.00')
        )

        self.montant_total = (
            total_produits + self.frais_livraison
        )

        self.save(
            update_fields=['montant_total']
        )

    def valider_commande(self):
        """
    Valide la commande et décrémente le stock des produits.

    Vérifie :
    - que la commande est encore en cours ;
    - que le stock est suffisant ;
    - qu'aucun lot périmé ne concerne les produits commandés.

    Enregistre également chaque sortie de stock dans l'historique.
    """

        if self.statut != StatutCommande.EN_COURS:
            raise ValueError(
            "Seules les commandes en cours peuvent être validées."
        )

        aujourd_hui = date.today()

    # Import local pour éviter une éventuelle dépendance circulaire
        from catalogue.models import (
            MouvementStock,
            TypeMouvementStock,
        )

    # ========================================================
    # VÉRIFICATIONS
    # ========================================================

        for ligne in self.lignes.select_related('produit').all():

            produit = ligne.produit

        # ----------------------------------------------------
        # STOCK INSUFFISANT
        # ----------------------------------------------------

        if produit.stock < ligne.quantite:
            raise ValueError(
                f"Stock insuffisant pour {produit.nom}. "
                f"Disponible : {produit.stock}, "
                f"Demandé : {ligne.quantite}"
            )

        # ----------------------------------------------------
        # LOT PÉRIMÉ
        # ----------------------------------------------------

        lots_perimes = produit.details_approvisionnement.filter(
            date_peremption__lte=aujourd_hui,
            quantite__gt=0,
        )

        if lots_perimes.exists():

            lot = lots_perimes.order_by(
                'date_peremption'
            ).first()

            raise ValueError(
                f"Vente impossible pour {produit.nom} : "
                f"le lot {lot.numero_lot} est périmé "
                f"depuis le "
                f"{lot.date_peremption.strftime('%d/%m/%Y')}."
            )

    # ========================================================
    # DÉCRÉMENTATION DU STOCK + HISTORIQUE
    # ========================================================

        for ligne in self.lignes.select_related('produit').all():

            produit = ligne.produit

            stock_avant = produit.stock

            produit.stock -= ligne.quantite

            produit.save(
            update_fields=['stock']
        )

        MouvementStock.objects.create(
            produit=produit,
            type_mouvement=TypeMouvementStock.VENTE,
            quantite=ligne.quantite,
            stock_avant=stock_avant,
            stock_apres=produit.stock,
            reference=f"Commande #{self.pk}",
        )

    # ========================================================
    # VALIDATION DE LA COMMANDE
    # ========================================================

        self.statut = StatutCommande.VALIDEE

        self.save(
            update_fields=['statut']
    )

    def annuler_commande(self, motif):
        """
    Annule la commande avec un motif obligatoire.

    Si la commande était déjà validée, le stock est restauré
    et un mouvement d'annulation est enregistré.
    """

        if self.statut == StatutCommande.ANNULEE:
            raise ValueError(
            "Cette commande est déjà annulée."
        )

    # Import local pour éviter une dépendance circulaire
        from catalogue.models import (
            MouvementStock,
            TypeMouvementStock,
    )

    # ========================================================
    # RESTAURATION DU STOCK
    # ========================================================

        if self.statut == StatutCommande.VALIDEE:

            for ligne in self.lignes.select_related('produit').all():

                produit = ligne.produit

                stock_avant = produit.stock

                produit.stock += ligne.quantite

                produit.save(
                    update_fields=['stock']
            )

            MouvementStock.objects.create(
                produit=produit,
                type_mouvement=TypeMouvementStock.ANNULATION,
                quantite=ligne.quantite,
                stock_avant=stock_avant,
                stock_apres=produit.stock,
                reference=f"Commande #{self.pk}",
            )

    # ========================================================
    # ANNULATION DE LA COMMANDE
    # ========================================================

        self.statut = StatutCommande.ANNULEE
        self.motif_annulation = motif

        self.save(
            update_fields=[
            'statut',
            'motif_annulation',
        ]
    )

class StatutLivraison(models.TextChoices):
    A_PREPARER = 'A_Preparer', 'À préparer'
    EN_PREPARATION = 'En_Preparation', 'En préparation'
    EXPEDIEE = 'Expediee', 'Expédiée'
    LIVREE = 'Livree', 'Livrée'
    ANNULEE = 'Annulee', 'Annulée'


class Livraison(models.Model):
    commande = models.OneToOneField(
        Commande,
        on_delete=models.PROTECT,
        related_name='livraison',
        verbose_name='Commande',
    )

    adresse_livraison = models.TextField(
        verbose_name='Adresse de livraison'
    )

    telephone_contact = models.CharField(
        max_length=20,
        verbose_name='Téléphone de contact'
    )

    date_creation = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Date de création'
    )

    date_prevue = models.DateField(
        verbose_name='Date prévue de livraison'
    )

    date_expedition = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Date d'expédition"
    )

    date_livraison = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='Date de livraison'
    )

    statut = models.CharField(
        max_length=30,
        choices=StatutLivraison.choices,
        default=StatutLivraison.A_PREPARER,
        verbose_name='Statut'
    )

    def __str__(self):
        return f"Livraison commande #{self.commande.pk}"

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

    date_paiement = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Date de paiement',
    )

    mode_paiement = models.CharField(
        max_length=20,
        choices=ModePaiement.choices,
        verbose_name='Mode de paiement',
    )

    statut = models.CharField(
        max_length=20,
        choices=StatutPaiement.choices,
        default=StatutPaiement.EN_ATTENTE,
        verbose_name='Statut du paiement',
    )

    reference = models.CharField(
        max_length=100,
        unique=True,
        blank=True,
        null=True,
        verbose_name='Référence du paiement',
    )

    class Meta:
        verbose_name = 'Paiement'
        verbose_name_plural = 'Paiements'
        ordering = ['-date_paiement']

    def __str__(self):
        return (
            f'Paiement #{self.pk} - '
            f'{self.montant} FCFA - '
            f'{self.get_statut_display()}'
        )

    @property
    def idPaiement(self):
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
        """Génère un numéro de facture séquentiel pour l'année."""
        from datetime import datetime

        annee = datetime.now().strftime('%Y')

        compteurs = []

    # Chercher les factures au nouveau format : FAC-2026-0001
        factures_nouveau_format = Facture.objects.filter(
            numero__startswith=f'FAC-{annee}-'
        )

        for facture in factures_nouveau_format:
            try:
                numero = int(facture.numero.split('-')[-1])
                compteurs.append(numero)
            except (ValueError, IndexError):
                continue

    # Prendre également en compte les anciens numéros :
    # FAC-20260902-0001
    # FAC-20260903-0001
        factures_ancien_format = Facture.objects.filter(
            numero__startswith=f'FAC-{annee}'
        )

        for facture in factures_ancien_format:
            try:
                numero = int(facture.numero.split('-')[-1])
                compteurs.append(numero)
            except (ValueError, IndexError):
                continue

        compteur = max(compteurs, default=0) + 1

        return f'FAC-{annee}-{compteur:04d}'

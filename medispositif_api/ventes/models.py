from decimal import Decimal

from django.db import models, transaction
from django.db.models import Sum
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.core.validators import MinValueValidator

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


class Panier(models.Model):
    """
    Modèle de panier d'achat pour les clients.
    Stocke les articles ajoutés au panier d'un utilisateur avant validation de commande.
    """

    client = models.ForeignKey(
        'authentication.Utilisateur',
        on_delete=models.CASCADE,
        related_name='paniers',
        verbose_name='Client',
        limit_choices_to={'role': Role.CLIENT},
    )
    date_creation = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Date de création',
    )
    date_modification = models.DateTimeField(
        auto_now=True,
        verbose_name='Date de modification',
    )

    class Meta:
        verbose_name = 'Panier'
        verbose_name_plural = 'Paniers'
        ordering = ['-date_creation']

    def __str__(self):
        return f'Panier de {self.client.email} - {self.date_creation.strftime("%d/%m/%Y %H:%M")}'

    @property
    def idPanier(self):
        """Alias conforme au diagramme UML pour l'identifiant de panier."""
        return self.pk


class LignePanier(models.Model):
    """
    Ligne de panier représentant un produit et sa quantité dans un panier.
    """

    panier = models.ForeignKey(
        Panier,
        on_delete=models.CASCADE,
        related_name='lignes',
        verbose_name='Panier',
    )
    produit = models.ForeignKey(
        'catalogue.ProduitMedical',
        on_delete=models.CASCADE,
        related_name='lignes_panier',
        verbose_name='Produit',
    )
    quantite = models.PositiveIntegerField(
        default=1,
        verbose_name='Quantité',
        validators=[MinValueValidator(1)],
    )
    date_ajout = models.DateTimeField(
        auto_now_add=True,
        verbose_name='Date d\'ajout',
    )

    class Meta:
        verbose_name = 'Ligne de panier'
        verbose_name_plural = 'Lignes de panier'
        ordering = ['-date_ajout']
        unique_together = ['panier', 'produit']

    def __str__(self):
        return f'{self.quantite}x {self.produit.nom} dans panier {self.panier.id}'

    @property
    def idLignePanier(self):
        """Alias conforme au diagramme UML pour l'identifiant de ligne de panier."""
        return self.pk

    @property
    def prix_unitaire(self):
        """Prix unitaire du produit au moment de l'ajout."""
        return self.produit.prix

    @property
    def montant(self):
        """Montant total de la ligne (quantité × prix unitaire)."""
        return self.quantite * self.prix_unitaire


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
    mode_paiement = models.CharField(
        max_length=20,
        choices=ModePaiement.choices,
        default=ModePaiement.ESPECES,
        verbose_name='Mode de paiement choisi par le client',
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

    @transaction.atomic
    def valider_commande(self):
        """
        Valide la commande et décrémente le stock des produits.
        Vérifie la disponibilité du stock avant validation.
        Crée automatiquement un paiement et une facture en utilisant le mode de paiement choisi par le client.
        """
        print(f"Validating commande #{self.pk}, statut: {self.statut}")
        
        if self.statut != StatutCommande.EN_COURS:
            raise ValueError("Seules les commandes en cours peuvent être validées.")

        print(f"Checking stock for {self.lignes.count()} lines")
        for ligne in self.lignes.all():
            print(f"Produit: {ligne.produit.nom}, stock: {ligne.produit.stock}, demandé: {ligne.quantite}")
            if ligne.produit.stock < ligne.quantite:
                raise ValueError(
                    f"Stock insuffisant pour {ligne.produit.nom}. "
                    f"Disponible: {ligne.produit.stock}, Demandé: {ligne.quantite}"
                )

        print("Stock verification passed, proceeding with validation")
        for ligne in self.lignes.all():
            ligne.produit.stock -= ligne.quantite
            ligne.produit.save(update_fields=['stock'])

        self.statut = StatutCommande.VALIDEE
        self.save(update_fields=['statut'])

        print("Creating payment and invoice")
        Paiement.objects.update_or_create(
            commande=self,
            defaults={'montant': self.montant_total, 'mode_paiement': self.mode_paiement},
        )

        # La facture et le paiement sont créés une seule fois.
        Facture.objects.get_or_create(
            commande=self,
            defaults={'montant': self.montant_total},
        )
        print("Validation completed successfully")
        
        # Envoyer la notification de validation directement après la validation
        print("Envoi notification de validation par email...")
        envoyer_notification_validation(self)

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
        
        # Envoyer la notification d'annulation directement après l'annulation
        print("Envoi notification d'annulation par email...")
        envoyer_notification_annulation(self)


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


def envoyer_facture_email(instance):
    """
    Envoie automatiquement la facture par email au client lors de sa création.
    """
    if instance.commande.client.email:
        try:
            context = {
                'client_nom': instance.commande.client.nom,
                'client_prenom': instance.commande.client.prenom,
                'numero_facture': instance.numero,
                'date_emission': instance.date_emission.strftime('%d/%m/%Y'),
                'montant_total': instance.montant,
                'numero_commande': instance.commande.pk,
                'lignes': [
                    {
                        'nom_produit': ligne.produit.nom,
                        'quantite': ligne.quantite,
                        'prix_unitaire': ligne.prix_unitaire,
                        'montant': ligne.montant,
                    }
                    for ligne in instance.commande.lignes.all()
                ],
            }
            
            html_content = render_to_string('emails/facture_email.html', context)
            
            print(f"Tentative d'envoi de l'email pour la facture #{instance.numero} à {instance.commande.client.email}")
            print(f"Configuration EMAIL_HOST: {settings.EMAIL_HOST}")
            print(f"Configuration EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
            print(f"Configuration EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
            
            result = send_mail(
                subject=f'Votre facture #{instance.numero} - CONSOMCARE',
                message='Votre facture est disponible en pièce jointe.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[instance.commande.client.email],
                html_message=html_content,
                fail_silently=False,
            )
            
            print(f"Résultat de l'envoi d'email: {result}")
            print(f"OK Facture #{instance.numero} envoyee par email a {instance.commande.client.email}")
        except Exception as e:
            print(f"ERREUR lors de l'envoi de l'email pour la facture #{instance.numero}: {str(e)}")
            import traceback
            traceback.print_exc()


@receiver(post_save, sender=Facture)
def envoyer_facture_par_email(sender, instance, created, **kwargs):
    if created:
        envoyer_facture_email(instance)


def envoyer_notification_validation(instance):
    """
    Envoie un email au client pour confirmer la validation de sa commande.
    """
    print(f"=== DEBUT ENVOI NOTIFICATION VALIDATION ===")
    print(f"Commande ID: {instance.pk}")
    print(f"Client: {instance.client}")
    print(f"Client email: {instance.client.email}")
    print(f"Client email existe: {bool(instance.client.email)}")
    
    if instance.client.email:
        try:
            context = {
                'client_nom': instance.client.nom,
                'client_prenom': instance.client.prenom,
                'numero_commande': instance.pk,
                'date_commande': instance.date_commande.strftime('%d/%m/%Y %H:%M'),
                'montant_total': instance.montant_total,
                'mode_paiement': instance.get_mode_paiement_display(),
                'lignes': [
                    {
                        'nom_produit': ligne.produit.nom,
                        'quantite': ligne.quantite,
                        'prix_unitaire': ligne.prix_unitaire,
                        'montant': ligne.montant,
                    }
                    for ligne in instance.lignes.all()
                ],
            }
            
            html_content = render_to_string('emails/validation_commande.html', context)
            
            print(f"Template HTML genere, longueur: {len(html_content)}")
            print(f"Tentative d'envoi a: {instance.client.email}")
            
            result = send_mail(
                subject=f'OK Votre commande #{instance.pk} a ete validee - CONSOMCARE',
                message='Votre commande a été validée avec succès.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[instance.client.email],
                html_message=html_content,
                fail_silently=False,
            )
            
            print(f"OK Notification de validation envoyee avec succes! Resultat: {result}")
            print(f"=== FIN ENVOI NOTIFICATION VALIDATION ===")
        except Exception as e:
            print(f"ERREUR lors de l'envoi de notification de validation: {str(e)}")
            import traceback
            traceback.print_exc()
            print(f"=== FIN ENVOI NOTIFICATION VALIDATION (ERREUR) ===")
    else:
        print(f"ATTENTION Pas d'email client disponible pour la commande #{instance.pk}")
        print(f"=== FIN ENVOI NOTIFICATION VALIDATION (PAS D'EMAIL) ===")


def envoyer_notification_annulation(instance):
    """
    Envoie un email au client pour informer de l'annulation de sa commande.
    """
    if instance.client.email:
        try:
            context = {
                'client_nom': instance.client.nom,
                'client_prenom': instance.client.prenom,
                'numero_commande': instance.pk,
                'date_commande': instance.date_commande.strftime('%d/%m/%Y %H:%M'),
                'montant_total': instance.montant_total,
                'motif_annulation': instance.motif_annulation or "Non spécifié",
            }
            
            html_content = render_to_string('emails/annulation_commande.html', context)
            
            print(f"Tentative d'envoi de notification d'annulation pour commande #{instance.pk} à {instance.client.email}")
            
            result = send_mail(
                subject=f'ERREUR Votre commande #{instance.pk} a ete annulee - CONSOMCARE',
                message='Votre commande a été annulée.',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[instance.client.email],
                html_message=html_content,
                fail_silently=False,
            )
            
            print(f"OK Notification d'annulation envoyee a {instance.client.email}, resultat: {result}")
        except Exception as e:
            print(f"ERREUR lors de l'envoi de notification d'annulation pour commande #{instance.pk}: {str(e)}")
            import traceback
            traceback.print_exc()

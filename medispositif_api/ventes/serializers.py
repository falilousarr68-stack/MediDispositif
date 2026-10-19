from rest_framework import serializers
from django.db.models import Sum
from decimal import Decimal

from authentication.models import Utilisateur
from catalogue.models import ProduitMedical
from systeme.models import ParametreSysteme
from .models import (
    Commande,
    Facture,
    LigneCommande,
    ModePaiement,
    Paiement,
    StatutCommande,
    StatutPaiement,
    Livraison,
    StatutLivraison,
)


class LigneCommandeSerializer(serializers.ModelSerializer):
    """Serializer pour les lignes de commande."""

    idProduit = serializers.PrimaryKeyRelatedField(
        source='produit',
        queryset=ProduitMedical.objects.all(),
    )
    nom_produit = serializers.CharField(source='produit.nom', read_only=True)
    prix_produit = serializers.DecimalField(
        source='produit.prix',
        max_digits=10,
        decimal_places=2,
        read_only=True,
    )

    class Meta:
        model = LigneCommande
        fields = [
            'id',
            'idProduit',
            'nom_produit',
            'prix_produit',
            'quantite',
            'prix_unitaire',
            'montant',
        ]
        read_only_fields = ['montant']

    def validate(self, data):
        produit = data.get('produit')
        quantite = data.get('quantite')

        if produit and quantite:
            if produit.stock < quantite:
                raise serializers.ValidationError(
                    f"Stock insuffisant pour {produit.nom}. "
                    f"Disponible: {produit.stock}, Demandé: {quantite}"
                )

        return data


class LigneCommandeCreateSerializer(serializers.ModelSerializer):
    """Serializer simplifié pour la création de lignes de commande."""

    idProduit = serializers.PrimaryKeyRelatedField(
        source='produit',
        queryset=ProduitMedical.objects.all(),
    )

    class Meta:
        model = LigneCommande
        fields = ['idProduit', 'quantite', 'prix_unitaire']

    def validate(self, data):
        produit = data.get('produit')
        quantite = data.get('quantite')

        if produit and quantite:
            if produit.stock < quantite:
                raise serializers.ValidationError(
                    f"Stock insuffisant pour {produit.nom}. "
                    f"Disponible: {produit.stock}, Demandé: {quantite}"
                )

        return data


class CommandeListSerializer(serializers.ModelSerializer):
    """Serializer allégé pour la liste des commandes."""

    idCommande = serializers.IntegerField(source='pk', read_only=True)
    nom_client = serializers.SerializerMethodField()
    email_client = serializers.CharField(source='client.email', read_only=True)
    nombre_lignes = serializers.SerializerMethodField()
    total_paye = serializers.SerializerMethodField()
    montant_restant = serializers.SerializerMethodField()


    class Meta:
        model = Commande
        fields = [
            'idCommande',
            'nom_client',
            'email_client',
            'date_commande',
            'montant_total',
            'total_paye',
            'montant_restant',
            'statut',
            'nombre_lignes',
        ]

    def get_total_paye(self, obj):

        total = obj.paiements.filter(
        statut=StatutPaiement.REUSSI
    ).aggregate(
        total=Sum('montant')
    )['total']

        return total or 0

    def get_nom_client(self, obj):
        return f"{obj.client.prenom} {obj.client.nom}".strip()

    def get_nombre_lignes(self, obj):
        return obj.lignes.count()
    
    def get_montant_restant(self, obj):

        total_paye = obj.paiements.filter(
        statut=StatutPaiement.REUSSI
    ).aggregate(
        total=Sum('montant')
    )['total'] or 0

        return max(
        0,
        obj.montant_total - total_paye
    )


class CommandeDetailSerializer(serializers.ModelSerializer):
    """Serializer détaillé pour une commande avec ses lignes."""

    idCommande = serializers.IntegerField(source='pk', read_only=True)
    client = serializers.SerializerMethodField()
    lignes = LigneCommandeSerializer(many=True, read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)

    class Meta:
        model = Commande
        fields = [
            'idCommande',
            'client',
            'date_commande',
            'montant_total',
            'statut',
            'statut_display',
            'motif_annulation',
            'lignes',
        ]
        read_only_fields = ['montant_total', 'statut', 'motif_annulation']

    def get_client(self, obj):
        return {
            'id': obj.client.idUser,
            'nom': obj.client.nom,
            'prenom': obj.client.prenom,
            'email': obj.client.email,
            'telephone': obj.client.telephone,
        }


class CommandeCreateSerializer(serializers.ModelSerializer):
    """Serializer pour la création d'une commande avec ses lignes."""

    idCommande = serializers.IntegerField(
        source='pk',
        read_only=True
    )

    lignes = LigneCommandeCreateSerializer(
        many=True,
        write_only=True
    )

    class Meta:
        model = Commande
        fields = [
            'idCommande',
            'lignes',
        ]

    def create(self, validated_data):
        lignes_data = validated_data.pop('lignes')

        client = self.context['request'].user

        # Récupérer les frais de livraison configurés
        parametre_frais = ParametreSysteme.objects.filter(
            nom="frais_livraison"
        ).first()

        if parametre_frais:
            try:
                frais_livraison = Decimal(parametre_frais.valeur)
            except (ValueError, TypeError):
                frais_livraison = Decimal('0.00')
        else:
            frais_livraison = Decimal('0.00')

        # Éviter une valeur négative
        if frais_livraison < Decimal('0.00'):
            frais_livraison = Decimal('0.00')

        commande = Commande.objects.create(
            client=client,
            frais_livraison=frais_livraison,
        )

        for ligne_data in lignes_data:
            produit = ligne_data['produit']
            quantite = ligne_data['quantite']

            prix_unitaire = ligne_data.get(
                'prix_unitaire',
                produit.prix
            )

            LigneCommande.objects.create(
                commande=commande,
                produit=produit,
                quantite=quantite,
                prix_unitaire=prix_unitaire,
            )

        commande.refresh_from_db()

        return commande


class CommandeValidationSerializer(serializers.Serializer):
    """Serializer pour la validation d'une commande."""

    motif = serializers.CharField(required=False, allow_blank=True)


class PaiementSerializer(serializers.ModelSerializer):

    idPaiement = serializers.IntegerField(
        source='pk',
        read_only=True
    )

    idCommande = serializers.PrimaryKeyRelatedField(
        source='commande',
        queryset=Commande.objects.all(),
    )

    numero_commande = serializers.IntegerField(
        source='commande.pk',
        read_only=True
    )

    mode_paiement_display = serializers.CharField(
        source='get_mode_paiement_display',
        read_only=True
    )

    statut_display = serializers.CharField(
        source='get_statut_display',
        read_only=True
    )

    nom_client = serializers.CharField(
    source='commande.client.get_full_name',
    read_only=True
    )

    email_client = serializers.EmailField(
    source='commande.client.email',
    read_only=True
    )

    class Meta:

        model = Paiement

        fields = [
            'idPaiement',
            'idCommande',
            'numero_commande',
            'montant',
            'date_paiement',
            'mode_paiement',
            'mode_paiement_display',
            'statut',
            'statut_display',
            'reference',
            'nom_client',
            'email_client',
        ]

        read_only_fields = [
            'idPaiement',
            'date_paiement',
            'statut',
            'reference',
        ]

    def validate(self, data):

        commande = data.get('commande')
        montant = data.get('montant')

        if commande and montant is not None:

            total_deja_paye = commande.paiements.filter(
                statut=StatutPaiement.REUSSI
            ).aggregate(
                total=Sum('montant')
            )['total'] or 0

            montant_restant = (
                commande.montant_total
                - total_deja_paye
            )

            if montant_restant <= 0:

                raise serializers.ValidationError(
                    "Cette commande est déjà entièrement payée."
                )

            if montant > montant_restant:

                raise serializers.ValidationError(
                    f"Le montant du paiement "
                    f"({montant} FCFA) ne peut pas dépasser "
                    f"le montant restant "
                    f"({montant_restant} FCFA)."
                )

            if montant != montant_restant:

                raise serializers.ValidationError(
                    f"Le montant à payer doit être exactement "
                    f"de {montant_restant} FCFA."
                )

        return data

class FactureSerializer(serializers.ModelSerializer):
    """Serializer pour les factures."""

    idCommande = serializers.PrimaryKeyRelatedField(
        source='commande',
        queryset=Commande.objects.all(),
    )

    numero_commande = serializers.IntegerField(
        source='commande.pk',
        read_only=True,
    )

    client_info = serializers.SerializerMethodField()

    class Meta:
        model = Facture
        fields = [
            'id',
            'idCommande',
            'numero_commande',
            'numero',
            'date_emission',
            'montant',
            'client_info',
        ]

        read_only_fields = [
            'numero',
            'date_emission',
            'montant',
        ]

    def get_client_info(self, obj):
        return {
        'id': obj.commande.client.idUser,
        'nom': obj.commande.client.nom,
        'prenom': obj.commande.client.prenom,
        'email': obj.commande.client.email,
    }

    def validate_idCommande(self, value):
        if value.statut != StatutCommande.VALIDEE:
            raise serializers.ValidationError(
                "Une facture ne peut être générée que pour une commande validée."
            )

        if hasattr(value, 'facture'):
            raise serializers.ValidationError(
                "Une facture existe déjà pour cette commande."
            )

        return value

class LivraisonSerializer(serializers.ModelSerializer):
    idLivraison = serializers.IntegerField(source='id', read_only=True)
    idCommande = serializers.IntegerField(source='commande.id', read_only=True)
    numero_commande = serializers.IntegerField(
        source='commande.id',
        read_only=True
    )
    statut_display = serializers.CharField(
        source='get_statut_display',
        read_only=True
    )

    class Meta:
        model = Livraison
        fields = [
            'idLivraison',
            'idCommande',
            'numero_commande',
            'adresse_livraison',
            'telephone_contact',
            'date_creation',
            'date_prevue',
            'date_expedition',
            'date_livraison',
            'statut',
            'statut_display',
        ]

        read_only_fields = [
            'idLivraison',
            'idCommande',
            'numero_commande',
            'date_creation',
            'date_expedition',
            'date_livraison',
            'statut_display',
        ]
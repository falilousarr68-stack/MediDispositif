from rest_framework import serializers

from authentication.models import Utilisateur
from catalogue.models import ProduitMedical
from .models import (
    Commande,
    Facture,
    LigneCommande,
    ModePaiement,
    Paiement,
    StatutCommande,
    Panier,
    LignePanier,
)


class LignePanierSerializer(serializers.ModelSerializer):
    """Serializer pour les lignes de panier."""

    idProduit = serializers.PrimaryKeyRelatedField(
        source='produit',
        queryset=ProduitMedical.objects.all(),
    )
    nom_produit = serializers.CharField(source='produit.nom', read_only=True)
    nom_catalogue = serializers.CharField(source='produit.nom_catalogue', read_only=True)
    image = serializers.ImageField(source='produit.image', read_only=True)
    prix_unitaire = serializers.DecimalField(
        source='produit.prix',
        max_digits=10,
        decimal_places=2,
        read_only=True,
    )
    stock = serializers.IntegerField(source='produit.stock', read_only=True)

    class Meta:
        model = LignePanier
        fields = [
            'id',
            'idLignePanier',
            'idProduit',
            'nom_produit',
            'nom_catalogue',
            'image',
            'quantite',
            'prix_unitaire',
            'montant',
            'stock',
        ]
        read_only_fields = ['montant']


class PanierSerializer(serializers.ModelSerializer):
    """Serializer pour le panier."""

    idPanier = serializers.IntegerField(source='pk', read_only=True)
    lignes = LignePanierSerializer(many=True, read_only=True)
    nombre_articles = serializers.SerializerMethodField()
    montant_total = serializers.SerializerMethodField()

    class Meta:
        model = Panier
        fields = [
            'idPanier',
            'client',
            'date_creation',
            'date_modification',
            'lignes',
            'nombre_articles',
            'montant_total',
        ]
        read_only_fields = ['idPanier', 'date_creation', 'date_modification']

    def get_nombre_articles(self, obj):
        """Calcule le nombre total d'articles dans le panier."""
        return sum(ligne.quantite for ligne in obj.lignes.all())

    def get_montant_total(self, obj):
        """Calcule le montant total du panier."""
        return sum(ligne.montant for ligne in obj.lignes.all())


class AjouterAuPanierSerializer(serializers.Serializer):
    """Serializer pour ajouter un produit au panier."""

    idProduit = serializers.PrimaryKeyRelatedField(
        queryset=ProduitMedical.objects.all(),
        source='produit',
    )
    quantite = serializers.IntegerField(default=1, min_value=1, max_value=100)

    class Meta:
        fields = ['idProduit', 'quantite']


class ModifierQuantitePanierSerializer(serializers.Serializer):
    """Serializer pour modifier la quantité d'un article dans le panier."""

    quantite = serializers.IntegerField(min_value=1, max_value=100)

    class Meta:
        fields = ['quantite']


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
    nom_client = serializers.CharField(source='client.get_full_name', read_only=True)
    email_client = serializers.CharField(source='client.email', read_only=True)
    nombre_lignes = serializers.SerializerMethodField()
    mode_paiement_display = serializers.CharField(source='get_mode_paiement_display', read_only=True)

    class Meta:
        model = Commande
        fields = [
            'idCommande',
            'nom_client',
            'email_client',
            'date_commande',
            'montant_total',
            'statut',
            'mode_paiement',
            'mode_paiement_display',
            'nombre_lignes',
        ]

    def get_nombre_lignes(self, obj):
        return obj.lignes.count()


class CommandeDetailSerializer(serializers.ModelSerializer):
    """Serializer détaillé pour une commande avec ses lignes."""

    idCommande = serializers.IntegerField(source='pk', read_only=True)
    client = serializers.SerializerMethodField()
    lignes = LigneCommandeSerializer(many=True, read_only=True)
    statut_display = serializers.CharField(source='get_statut_display', read_only=True)
    mode_paiement_display = serializers.CharField(source='get_mode_paiement_display', read_only=True)

    class Meta:
        model = Commande
        fields = [
            'idCommande',
            'client',
            'date_commande',
            'montant_total',
            'statut',
            'statut_display',
            'mode_paiement',
            'mode_paiement_display',
            'motif_annulation',
            'lignes',
        ]
        read_only_fields = ['montant_total', 'statut', 'motif_annulation', 'mode_paiement']

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

    lignes = LigneCommandeCreateSerializer(many=True, write_only=True)
    mode_paiement = serializers.ChoiceField(
        choices=ModePaiement.choices,
        required=False,
        default=ModePaiement.ESPECES,
    )

    class Meta:
        model = Commande
        fields = ['lignes', 'mode_paiement']

    def create(self, validated_data):
        lignes_data = validated_data.pop('lignes')
        mode_paiement = validated_data.pop('mode_paiement', ModePaiement.ESPECES)
        client = self.context['request'].user

        commande = Commande.objects.create(
            client=client,
            mode_paiement=mode_paiement
        )

        for ligne_data in lignes_data:
            produit = ligne_data['produit']
            quantite = ligne_data['quantite']
            prix_unitaire = ligne_data.get('prix_unitaire', produit.prix)

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
    """Serializer pour les paiements."""

    idPaiement = serializers.IntegerField(source='pk', read_only=True)
    idCommande = serializers.PrimaryKeyRelatedField(
        source='commande',
        queryset=Commande.objects.all(),
    )
    numero_commande = serializers.IntegerField(source='commande.pk', read_only=True)
    mode_paiement_display = serializers.CharField(
        source='get_mode_paiement_display',
        read_only=True,
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
        ]

    def validate(self, data):
        commande = data.get('commande')
        montant = data.get('montant')

        if commande and montant:
            total_deja_paye = commande.paiements.aggregate(
                total=serializers.Sum('montant')
            )['total'] or 0

            if total_deja_paye + montant > commande.montant_total:
                raise serializers.ValidationError(
                    f"Le montant total des paiements ({total_deja_paye + montant}) "
                    f"ne peut pas dépasser le montant de la commande ({commande.montant_total})."
                )

        return data


class FactureSerializer(serializers.ModelSerializer):
    """Serializer pour les factures."""

    idCommande = serializers.PrimaryKeyRelatedField(
        source='commande',
        queryset=Commande.objects.all(),
    )
    numero_commande = serializers.IntegerField(source='commande.pk', read_only=True)
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
        read_only_fields = ['numero', 'date_emission', 'montant']

    def get_client_info(self, obj):
        return {
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

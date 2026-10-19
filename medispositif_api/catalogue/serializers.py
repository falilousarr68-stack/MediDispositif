from rest_framework import serializers

from .models import (
    Approvisionnement,
    Catalogue,
    DetailsApprovisionnement,
    ProduitMedical,
    MouvementStock,
)


class CatalogueSerializer(serializers.ModelSerializer):
    idCatalogue = serializers.IntegerField(
        source='pk',
        read_only=True
    )

    nombre_produits = serializers.SerializerMethodField()

    class Meta:
        model = Catalogue
        fields = [
            'idCatalogue',
            'nom',
            'nombre_produits',
        ]

    def get_nombre_produits(self, obj):
        return obj.produits.count()


class ProduitMedicalSerializer(serializers.ModelSerializer):
    idProduit = serializers.IntegerField(
        source='pk',
        read_only=True
    )

    idCatalogue = serializers.PrimaryKeyRelatedField(
        source='catalogue',
        queryset=Catalogue.objects.all(),
    )

    nom_catalogue = serializers.CharField(
        source='catalogue.nom',
        read_only=True
    )

    class Meta:
        model = ProduitMedical
        fields = [
            'idProduit',
            'idCatalogue',
            'nom_catalogue',
            'nom',
            'description',
            'prix',
            'stock',
            'image',
        ]

        read_only_fields = [
            'stock',
        ]


class ProduitMedicalListSerializer(serializers.ModelSerializer):
    """
    Serializer utilisé pour la liste et la recherche publique
    des produits médicaux.
    """

    idProduit = serializers.IntegerField(
        source='pk',
        read_only=True
    )

    idCatalogue = serializers.IntegerField(
        source='catalogue.pk',
        read_only=True
    )

    nom_catalogue = serializers.CharField(
        source='catalogue.nom',
        read_only=True
    )

    class Meta:
        model = ProduitMedical
        fields = [
            'idProduit',
            'idCatalogue',
            'nom',
            'description',
            'prix',
            'stock',
            'nom_catalogue',
            'image',
        ]


class DetailsApprovisionnementSerializer(serializers.ModelSerializer):
    idDetailApp = serializers.IntegerField(
        source='pk',
        read_only=True
    )

    idProduit = serializers.PrimaryKeyRelatedField(
        source='produit',
        queryset=ProduitMedical.objects.all(),
    )

    nom_produit = serializers.CharField(
        source='produit.nom',
        read_only=True
    )

    class Meta:
        model = DetailsApprovisionnement
        fields = [
            'idDetailApp',
            'idProduit',
            'nom_produit',
            'quantite',
            'prix_unitaire_achat',
            'montant',
            'date_peremption',
            'numero_lot',
        ]

        read_only_fields = [
            'montant',
        ]


class ApprovisionnementSerializer(serializers.ModelSerializer):
    idApp = serializers.IntegerField(
        source='pk',
        read_only=True
    )

    details = DetailsApprovisionnementSerializer(
        many=True,
        read_only=True
    )

    class Meta:
        model = Approvisionnement
        fields = [
            'idApp',
            'date_app',
            'quantite_produit',
            'details',
        ]

        read_only_fields = [
            'date_app',
            'quantite_produit',
        ]


class ApprovisionnementCreateSerializer(serializers.ModelSerializer):
    """
    Création d'un approvisionnement avec ses détails
    en une seule requête.
    """

    details = DetailsApprovisionnementSerializer(
        many=True,
        write_only=True
    )

    class Meta:
        model = Approvisionnement
        fields = [
            'details',
        ]

    def create(self, validated_data):
        details_data = validated_data.pop('details')

        approvisionnement = Approvisionnement.objects.create()

        for detail_data in details_data:
            DetailsApprovisionnement.objects.create(
                approvisionnement=approvisionnement,
                **detail_data,
            )

        approvisionnement.refresh_from_db()

        return approvisionnement

class MouvementStockSerializer(serializers.ModelSerializer):
    """
    Serializer pour l'historique des mouvements de stock.
    """

    class Meta:
        model = MouvementStock
        fields = '__all__'

class MouvementStockSerializer(serializers.ModelSerializer):
    """
    Serializer pour l'historique des mouvements de stock.
    """

    idProduit = serializers.IntegerField(
        source='produit.pk',
        read_only=True
    )

    nom_produit = serializers.CharField(
        source='produit.nom',
        read_only=True
    )

    type_mouvement_display = serializers.CharField(
        source='get_type_mouvement_display',
        read_only=True
    )

    class Meta:
        model = MouvementStock
        fields = [
            'id',
            'idProduit',
            'nom_produit',
            'type_mouvement',
            'type_mouvement_display',
            'quantite',
            'stock_avant',
            'stock_apres',
            'date_mouvement',
            'reference',
        ]

        read_only_fields = [
            'id',
            'idProduit',
            'nom_produit',
            'type_mouvement_display',
            'quantite',
            'stock_avant',
            'stock_apres',
            'date_mouvement',
            'reference',
        ]
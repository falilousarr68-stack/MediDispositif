from rest_framework import serializers


class StatistiqueProduitSerializer(serializers.Serializer):
    """Serializer pour les statistiques de produits commandés vs stock total."""

    idProduit = serializers.IntegerField(read_only=True)
    nom = serializers.CharField(read_only=True)
    catalogue = serializers.CharField(read_only=True)
    stock_actuel = serializers.IntegerField(read_only=True)
    quantite_commandee = serializers.IntegerField(read_only=True)
    stock_total = serializers.IntegerField(read_only=True)
    pourcentage_vendu = serializers.FloatField(read_only=True)

    class Meta:
        fields = [
            'idProduit',
            'nom',
            'catalogue',
            'stock_actuel',
            'quantite_commandee',
            'stock_total',
            'pourcentage_vendu',
        ]

from rest_framework import serializers

from .models import ParametreSysteme, Rapport, TypeRapport


class ParametreSystemeSerializer(serializers.ModelSerializer):
    """Serializer pour les paramètres système."""

    class Meta:
        model = ParametreSysteme
        fields = [
            'id',
            'nom',
            'valeur',
            'description',
            'date_modification',
        ]
        read_only_fields = ['date_modification']


class ParametreSystemeCreateSerializer(serializers.ModelSerializer):
    """Serializer pour la création/mise à jour de paramètres système."""

    class Meta:
        model = ParametreSysteme
        fields = ['nom', 'valeur', 'description']

    def validate_nom(self, value):
        """Valide que le nom du paramètre est en snake_case."""
        if not value.replace('_', '').isalnum():
            raise serializers.ValidationError(
                "Le nom du paramètre doit être en snake_case (ex: adresse_entreprise)."
            )
        return value.lower()


class RapportListSerializer(serializers.ModelSerializer):
    """Serializer allégé pour la liste des rapports."""

    idRapport = serializers.IntegerField(source='pk', read_only=True)
    type_rapport_display = serializers.CharField(
        source='get_type_rapport_display',
        read_only=True,
    )
    genere_par_nom = serializers.CharField(source='genere_par.get_full_name', read_only=True)
    nom_fichier = serializers.CharField(source='chemin_acces', read_only=True)
    chemin_acces_url = serializers.SerializerMethodField()

    class Meta:
        model = Rapport
        fields = [
            'idRapport',
            'titre',
            'date_generation',
            'type_rapport',
            'type_rapport_display',
            'periode_debut',
            'periode_fin',
            'genere_par_nom',
            'nom_fichier',
            'chemin_acces_url',
        ]

    def get_chemin_acces_url(self, obj):
        if obj.chemin_acces:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.chemin_acces.url)
        return None


class RapportDetailSerializer(serializers.ModelSerializer):
    """Serializer détaillé pour un rapport."""

    idRapport = serializers.IntegerField(source='pk', read_only=True)
    type_rapport_display = serializers.CharField(
        source='get_type_rapport_display',
        read_only=True,
    )
    genere_par = serializers.SerializerMethodField()
    chemin_acces_url = serializers.SerializerMethodField()

    class Meta:
        model = Rapport
        fields = [
            'idRapport',
            'titre',
            'date_generation',
            'type_rapport',
            'type_rapport_display',
            'chemin_acces',
            'chemin_acces_url',
            'periode_debut',
            'periode_fin',
            'genere_par',
            'commentaires',
        ]
        read_only_fields = ['date_generation', 'chemin_acces']

    def get_genere_par(self, obj):
        if obj.genere_par:
            return {
                'id': obj.genere_par.idUser,
                'nom': obj.genere_par.nom,
                'prenom': obj.genere_par.prenom,
                'email': obj.genere_par.email,
            }
        return None

    def get_chemin_acces_url(self, obj):
        if obj.chemin_acces:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.chemin_acces.url)
        return None


class RapportCreateSerializer(serializers.ModelSerializer):
    """Serializer pour la création de rapports."""

    class Meta:
        model = Rapport
        fields = [
            'titre',
            'type_rapport',
            'periode_debut',
            'periode_fin',
            'commentaires',
        ]

    def validate(self, data):
        """Valide la cohérence des dates de période."""
        if data.get('type_rapport', TypeRapport.VENTES) != TypeRapport.VENTES:
            raise serializers.ValidationError(
                {'type_rapport': 'Seuls les rapports de ventes sont disponibles.'}
            )
        periode_debut = data.get('periode_debut')
        periode_fin = data.get('periode_fin')

        if periode_debut and periode_fin and periode_debut > periode_fin:
            raise serializers.ValidationError(
                "La date de début de période doit être antérieure à la date de fin."
            )

        return data

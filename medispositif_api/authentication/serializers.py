from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Role
from .models import Utilisateur
from django.contrib.auth.password_validation import validate_password

Utilisateur = get_user_model()


class InscriptionClientSerializer(serializers.ModelSerializer):
    """Serializer pour l'inscription publique d'un client."""

    adresse = serializers.CharField(
        required=True,
        allow_blank=False,
        trim_whitespace=True,
    )

    motdepasse = serializers.CharField(
        write_only=True,
        min_length=8,
        style={'input_type': 'password'},
    )
    confirmation_motdepasse = serializers.CharField(
        write_only=True,
        min_length=8,
        style={'input_type': 'password'},
    )

    class Meta:
        model = Utilisateur
        fields = [
            'email',
            'nom',
            'prenom',
            'telephone',
            'adresse',
            'motdepasse',
            'confirmation_motdepasse',
        ]

    def validate_email(self, value):
        if Utilisateur.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                'Un compte existe déjà avec cette adresse email.'
            )
        return value.lower()

    def validate(self, attrs):
        if attrs['motdepasse'] != attrs['confirmation_motdepasse']:
            raise serializers.ValidationError(
                {'confirmation_motdepasse': 'Les mots de passe ne correspondent pas.'}
            )
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirmation_motdepasse')
        motdepasse = validated_data.pop('motdepasse')

        utilisateur = Utilisateur.objects.create_user(
            password=motdepasse,
            role=Role.CLIENT,
            **validated_data,
        )
        return utilisateur


class ProfilUtilisateurSerializer(serializers.ModelSerializer):
    """Serializer de consultation et modification du profil utilisateur."""

    idUser = serializers.IntegerField(
        source='pk',
        read_only=True
    )

    role = serializers.CharField(
        read_only=True
    )

    role_display = serializers.CharField(
        source='get_role_display',
        read_only=True
    )

    class Meta:
        model = Utilisateur

        fields = [
            'idUser',
            'email',
            'nom',
            'prenom',
            'role',
            'role_display',
            'telephone',
            'adresse',
            'photo_profil',
            'date_joined',
        ]

        read_only_fields = [
            'idUser',
            'role',
            'role_display',
            'date_joined',
        ]

        extra_kwargs = {
            'email': {
                'required': False,
            },
            'nom': {
                'required': False,
            },
            'prenom': {
                'required': False,
            },
            'telephone': {
                'required': False,
            },
            'adresse': {
                'required': False,
            },
            'photo_profil': {
                'required': False,
                'allow_null': True,
            },
        }

class UtilisateurAdminSerializer(serializers.ModelSerializer):
    """
    Serializer utilisé par l'administrateur pour gérer les utilisateurs.
    """

    idUser = serializers.IntegerField(source='pk', read_only=True)
    role_display = serializers.CharField(
        source='get_role_display',
        read_only=True
    )

    class Meta:
        model = Utilisateur
        fields = [
            'idUser',
            'email',
            'nom',
            'prenom',
            'role',
            'role_display',
            'telephone',
            'adresse',
            'is_active',
            'date_joined',
        ]
        read_only_fields = [
            'idUser',
            'role_display',
            'date_joined',
        ]

class UtilisateurAdminCreateSerializer(serializers.ModelSerializer):
    """
    Serializer utilisé par l'administrateur pour créer
    les comptes des utilisateurs internes.

    Les clients créent eux-mêmes leur compte via
    l'inscription publique.
    """

    idUser = serializers.IntegerField(source='pk', read_only=True)

    role_display = serializers.CharField(
        source='get_role_display',
        read_only=True
    )

    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )

    class Meta:
        model = Utilisateur
        fields = [
            'idUser',
            'email',
            'nom',
            'prenom',
            'role',
            'role_display',
            'telephone',
            'adresse',
            'password',
            'is_active',
        ]

    def validate_role(self, value):
        """
        L'administrateur ne peut créer que des comptes internes.
        """

        roles_autorises = [
            Role.ADMINISTRATEUR,
            Role.RESPONSABLE_COMMERCIAL,
            Role.VENDEUR,
            Role.GESTIONNAIRE_STOCK,
        ]

        if value not in roles_autorises:
            raise serializers.ValidationError(
                "Le rôle Client ne peut pas être créé depuis "
                "l'espace administrateur. Le client doit utiliser "
                "l'inscription publique."
            )

        return value

    def create(self, validated_data):
        password = validated_data.pop('password')

        utilisateur = Utilisateur.objects.create_user(
            password=password,
            **validated_data
        )

        return utilisateur

class ChangerMotDePasseSerializer(serializers.Serializer):
    ancien_mot_de_passe = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    nouveau_mot_de_passe = serializers.CharField(
        write_only=True,
        required=True,
        min_length=8,
        validators=[validate_password],
        style={'input_type': 'password'}
    )

    confirmation_mot_de_passe = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    def validate(self, attrs):
        utilisateur = self.context['request'].user

        # Vérifier l'ancien mot de passe
        if not utilisateur.check_password(
            attrs['ancien_mot_de_passe']
        ):
            raise serializers.ValidationError({
                'ancien_mot_de_passe':
                    "L'ancien mot de passe est incorrect."
            })

        # Vérifier la confirmation
        if (
            attrs['nouveau_mot_de_passe']
            != attrs['confirmation_mot_de_passe']
        ):
            raise serializers.ValidationError({
                'confirmation_mot_de_passe':
                    "Les mots de passe ne correspondent pas."
            })

        # Empêcher de reprendre exactement le même mot de passe
        if utilisateur.check_password(
            attrs['nouveau_mot_de_passe']
        ):
            raise serializers.ValidationError({
                'nouveau_mot_de_passe':
                    "Le nouveau mot de passe doit être différent de l'ancien."
            })

        return attrs

    def save(self, **kwargs):
        utilisateur = self.context['request'].user

        utilisateur.set_password(
            self.validated_data['nouveau_mot_de_passe']
        )

        utilisateur.save(
            update_fields=['password']
        )

        return utilisateur
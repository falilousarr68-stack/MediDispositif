from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Role

Utilisateur = get_user_model()


class InscriptionClientSerializer(serializers.ModelSerializer):
    """Serializer pour l'inscription publique d'un client."""

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
            is_active=True,  # S'assurer que le client est actif
            **validated_data,
        )
        return utilisateur


class ProfilUtilisateurSerializer(serializers.ModelSerializer):
    """Serializer de lecture du profil utilisateur connecté."""

    idUser = serializers.IntegerField(source='pk', read_only=True)
    role = serializers.CharField(read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)

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
            'date_joined',
        ]
        read_only_fields = fields


class GestionUtilisateurSerializer(serializers.ModelSerializer):
    """
    Serializer pour la gestion complète des utilisateurs par l'administrateur.
    Permet la création, modification et suppression avec attribution de rôle.
    """

    idUser = serializers.IntegerField(source='pk', read_only=True)
    motdepasse = serializers.CharField(
        write_only=True,
        min_length=8,
        style={'input_type': 'password'},
        required=False,
    )
    confirmation_motdepasse = serializers.CharField(
        write_only=True,
        min_length=8,
        style={'input_type': 'password'},
        required=False,
    )

    class Meta:
        model = Utilisateur
        fields = [
            'idUser',
            'email',
            'nom',
            'prenom',
            'role',
            'telephone',
            'adresse',
            'motdepasse',
            'confirmation_motdepasse',
            'is_active',
            'date_joined',
        ]
        read_only_fields = ['idUser', 'date_joined']

    def validate_email(self, value):
        instance = self.instance
        if Utilisateur.objects.filter(email__iexact=value).exclude(pk=instance.pk if instance else None).exists():
            raise serializers.ValidationError(
                'Un compte existe déjà avec cette adresse email.'
            )
        return value.lower()

    def validate(self, attrs):
        motdepasse = attrs.get('motdepasse')
        confirmation_motdepasse = attrs.get('confirmation_motdepasse')

        if motdepasse or confirmation_motdepasse:
            if not motdepasse or not confirmation_motdepasse:
                raise serializers.ValidationError(
                    'Les deux champs mot de passe doivent être fournis ensemble.'
                )
            if motdepasse != confirmation_motdepasse:
                raise serializers.ValidationError(
                    {'confirmation_motdepasse': 'Les mots de passe ne correspondent pas.'}
                )

        return attrs

    def create(self, validated_data):
        validated_data.pop('confirmation_motdepasse')
        motdepasse = validated_data.pop('motdepasse', None)

        if not motdepasse:
            raise serializers.ValidationError(
                {'motdepasse': 'Le mot de passe est obligatoire pour la création.'}
            )

        # S'assurer que l'utilisateur est actif par défaut
        validated_data.setdefault('is_active', True)

        utilisateur = Utilisateur.objects.create_user(
            password=motdepasse,
            **validated_data,
        )
        return utilisateur

    def update(self, instance, validated_data):
        validated_data.pop('confirmation_motdepasse', None)
        motdepasse = validated_data.pop('motdepasse', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if motdepasse:
            instance.set_password(motdepasse)

        instance.save()
        return instance

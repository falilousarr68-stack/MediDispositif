from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Serializer JWT personnalisé incluant le rôle et les informations
    essentielles de l'utilisateur dans la réponse de connexion.
    """

    username_field = 'email'

    def validate(self, attrs):
        data = super().validate(attrs)

        utilisateur = self.user
        data['utilisateur'] = {
            'idUser': utilisateur.pk,
            'email': utilisateur.email,
            'nom': utilisateur.nom,
            'prenom': utilisateur.prenom,
            'role': utilisateur.role,
            'role_display': utilisateur.get_role_display(),
            'telephone': utilisateur.telephone,
        }
        return data

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from systeme.audit import enregistrer_audit
from systeme.models import TypeActionAudit

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Serializer JWT personnalisé incluant le rôle et les informations
    essentielles de l'utilisateur dans la réponse de connexion.
    """

    username_field = 'email'

    def validate(self, attrs):
        data = super().validate(attrs)
        enregistrer_audit(
    utilisateur=self.user,
    module="Authentification",
    action=TypeActionAudit.CONNEXION,
    description=(
        f"Connexion de l'utilisateur "
        f"{self.user.prenom} {self.user.nom}."
    ),
    reference=f"Utilisateur #{self.user.pk}",
)

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

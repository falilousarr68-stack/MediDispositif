from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import (
    InscriptionClientSerializer,
    ProfilUtilisateurSerializer,
)
from .tokens import CustomTokenObtainPairSerializer


class InscriptionClientView(generics.CreateAPIView):
    """
    Endpoint public d'inscription pour les clients.
    Crée un compte avec le rôle Client et retourne les informations du profil.
    """

    serializer_class = InscriptionClientSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        utilisateur = serializer.save()

        return Response(
            {
                'message': 'Compte client créé avec succès.',
                'utilisateur': ProfilUtilisateurSerializer(utilisateur).data,
            },
            status=status.HTTP_201_CREATED,
        )


class ConnexionView(TokenObtainPairView):
    """
    Endpoint de connexion JWT.
    Authentifie par email/mot de passe et retourne les tokens + le rôle.
    """

    serializer_class = CustomTokenObtainPairSerializer


class ProfilUtilisateurView(generics.RetrieveAPIView):
    """Endpoint de récupération du profil de l'utilisateur connecté."""

    serializer_class = ProfilUtilisateurSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

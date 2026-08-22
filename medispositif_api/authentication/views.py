from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.conf import settings
from smtplib import SMTPException
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

from .permissions import EstAdministrateur
from .serializers import (
    GestionUtilisateurSerializer,
    InscriptionClientSerializer,
    ProfilUtilisateurSerializer,
)
from .tokens import CustomTokenObtainPairSerializer

Utilisateur = get_user_model()


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


class DemandeReinitialisationMotDePasseView(generics.GenericAPIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        email = request.data.get('email', '').strip()
        utilisateur = Utilisateur.objects.filter(email__iexact=email, is_active=True).first()
        reset_url = None
        if utilisateur:
            uid = urlsafe_base64_encode(force_bytes(utilisateur.pk))
            token = default_token_generator.make_token(utilisateur)
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
            reset_url = f'{frontend_url}/fr/reset-password/{uid}/{token}'
            try:
                send_mail(
                    'Réinitialisation de votre mot de passe',
                    f'Réinitialisez votre mot de passe en ouvrant ce lien : {reset_url}',
                    None,
                    [utilisateur.email],
                    fail_silently=False,
                )
                if settings.EMAIL_BACKEND != 'django.core.mail.backends.console.EmailBackend':
                    reset_url = None
            except (SMTPException, OSError):
                if not settings.DEBUG:
                    return Response(
                        {'error': "Le service d'envoi d'e-mails est indisponible."},
                        status=status.HTTP_503_SERVICE_UNAVAILABLE,
                    )

        response = {'message': 'Si cette adresse existe, un lien de réinitialisation a été envoyé.'}
        if settings.DEBUG and reset_url:
            response['reset_url'] = reset_url
        return Response(response)


class ReinitialisationMotDePasseView(generics.GenericAPIView):
    permission_classes = [AllowAny]

    def post(self, request, uidb64, token, *args, **kwargs):
        try:
            utilisateur = Utilisateur.objects.get(pk=force_str(urlsafe_base64_decode(uidb64)))
        except (Utilisateur.DoesNotExist, ValueError, TypeError, OverflowError):
            utilisateur = None

        password = request.data.get('password', '')
        if not utilisateur or not default_token_generator.check_token(utilisateur, token) or len(password) < 6:
            return Response({'error': 'Lien invalide ou mot de passe trop court.'}, status=status.HTTP_400_BAD_REQUEST)

        utilisateur.set_password(password)
        utilisateur.save(update_fields=['password'])
        return Response({'message': 'Mot de passe réinitialisé avec succès.'})


class ProfilUtilisateurView(generics.RetrieveAPIView):
    """Endpoint de récupération du profil de l'utilisateur connecté."""

    serializer_class = ProfilUtilisateurSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class ListeUtilisateursView(generics.ListCreateAPIView):
    """
    Endpoint CRUD pour la gestion des utilisateurs par l'administrateur.
    Permet de lister tous les utilisateurs et d'en créer de nouveaux avec n'importe quel rôle.
    """

    serializer_class = GestionUtilisateurSerializer
    permission_classes = [IsAuthenticated, EstAdministrateur]

    def get_queryset(self):
        return Utilisateur.objects.all().order_by('nom', 'prenom')

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(
            {
                'message': 'Liste des utilisateurs récupérée avec succès.',
                'utilisateurs': serializer.data,
                'total': queryset.count(),
            },
            status=status.HTTP_200_OK,
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        utilisateur = serializer.save()

        return Response(
            {
                'message': 'Utilisateur créé avec succès.',
                'utilisateur': ProfilUtilisateurSerializer(utilisateur).data,
            },
            status=status.HTTP_201_CREATED,
        )


class DetailUtilisateurView(generics.RetrieveUpdateDestroyAPIView):
    """
    Endpoint de détail, modification et suppression d'un utilisateur par l'administrateur.
    """

    serializer_class = GestionUtilisateurSerializer
    permission_classes = [IsAuthenticated, EstAdministrateur]
    lookup_field = 'pk'

    def get_queryset(self):
        return Utilisateur.objects.all()

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = ProfilUtilisateurSerializer(instance)
        return Response(
            {
                'message': 'Utilisateur récupéré avec succès.',
                'utilisateur': serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=kwargs.get('partial', False))
        serializer.is_valid(raise_exception=True)
        utilisateur = serializer.save()

        return Response(
            {
                'message': 'Utilisateur modifié avec succès.',
                'utilisateur': ProfilUtilisateurSerializer(utilisateur).data,
            },
            status=status.HTTP_200_OK,
        )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.delete()
        return Response(
            {'message': 'Utilisateur supprimé avec succès.'},
            status=status.HTTP_204_NO_CONTENT,
        )

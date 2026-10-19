from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework.routers import DefaultRouter

from .views import (
    ConnexionView,
    InscriptionClientView,
    ProfilUtilisateurView,
    StatistiquesProfilView,
    UtilisateurAdminViewSet,
    DeconnexionView,
    ChangerMotDePasseView,
    MotDePasseOublieView,
    ReinitialiserMotDePasseView,
)

app_name = 'authentication'

router = DefaultRouter()

router.register(
    'utilisateurs',
    UtilisateurAdminViewSet,
    basename='utilisateur-admin'
)

urlpatterns = [
    path(
        'inscription/',
        InscriptionClientView.as_view(),
        name='inscription-client'
    ),

    path(
        'connexion/',
        ConnexionView.as_view(),
        name='connexion'
    ),

    path(
    'mot-de-passe-oublie/',
    MotDePasseOublieView.as_view(),
    name='mot-de-passe-oublie'
    ),

    path(
        'mot-de-passe-reinitialisation/',
        ReinitialiserMotDePasseView.as_view(),
        name='mot-de-passe-reinitialisation'
    ),

    path(
        'token/refresh/',
        TokenRefreshView.as_view(),
        name='token-refresh'
    ),

    path(
        'profil/',
        ProfilUtilisateurView.as_view(),
        name='profil'
    ),

    path(
        'profil/statistiques/',
        StatistiquesProfilView.as_view(),
        name='profil-statistiques'
    ),

    path(
        'deconnexion/',
        DeconnexionView.as_view(),
        name='deconnexion'
    ),

    path(
        'profil/mot-de-passe/',
        ChangerMotDePasseView.as_view(),
        name='changer-mot-de-passe'
    ),

    path(
        '',
        include(router.urls)
    ),
]
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import ConnexionView, InscriptionClientView, ProfilUtilisateurView

app_name = 'authentication'

urlpatterns = [
    path('inscription/', InscriptionClientView.as_view(), name='inscription-client'),
    path('connexion/', ConnexionView.as_view(), name='connexion'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('profil/', ProfilUtilisateurView.as_view(), name='profil'),
]

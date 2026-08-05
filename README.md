# MediDispositif

Étape 1 — Configuration initiale & Authentification JWT
L’étape 1 est implémentée et testée dans votre workspace. Voici le guide complet pour la reproduire et la comprendre.

1. Prérequis et environnement virtuel
Depuis le dossier medispositif_api :

python -m venv env
.\env\Scripts\Activate.ps1
pip install -r requirements.txt
Dépendances installées :

django — Framework web
djangorestframework — API REST
djangorestframework-simplejwt — Authentification JWT
django-cors-headers — Communication avec le frontend
2. Création du projet et de l'application
django-admin startproject config .
python manage.py startapp authentication
Structure obtenue :

medispositif_api/
├── config/              # Configuration Django (settings, urls)
├── authentication/      # App d'authentification
│   ├── models.py        # Modèle Utilisateur + Enum Role
│   ├── serializers.py   # Inscription & Profil
│   ├── views.py         # Endpoints API
│   ├── urls.py          # Routes auth
│   ├── tokens.py        # JWT personnalisé avec rôle
│   └── admin.py         # Interface admin
├── manage.py
└── requirements.txt
3. Modèle Utilisateur (Custom User)
Conforme au diagramme UML :

Attribut UML	Champ Django	Type
idUser
pk (propriété idUser)
int
nom
nom
CharField
prenom
prenom
CharField
email
email (USERNAME_FIELD)
EmailField
role
role
Enum Role
telephone
telephone
CharField
adresse
adresse
TextField (Client)
Enum Role : Administrateur, ResponsableCommercial, Vendeur, Client, GestionnaireDeStock

4. Configuration (config/settings.py)
Points clés :

AUTH_USER_MODEL = 'authentication.Utilisateur'
JWT comme authentification par défaut (DRF)
CORS activé pour localhost:3000 et localhost:5173
Langue fr-fr, fuseau Africa/Dakar
5. Endpoints API disponibles
Méthode	URL	Auth	Description
POST
/api/auth/inscription/
Non
Inscription Client
POST
/api/auth/connexion/
Non
Login JWT + rôle
POST
/api/auth/token/refresh/
Non
Rafraîchir le token
GET
/api/auth/profil/
Bearer JWT
Profil connecté
6. Migrations et lancement
python manage.py makemigrations authentication
python manage.py migrate
python manage.py runserver
Créer un superutilisateur (optionnel) :

python manage.py createsuperuser
7. Tests avec Postman ou PowerShell
Inscription client :

$body = '{"email":"client@test.com","nom":"Sarr","prenom":"Falilou","telephone":"771234567","adresse":"Dakar","motdepasse":"Test1234!","confirmation_motdepasse":"Test1234!"}'
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/auth/inscription/" -Method POST -Body $body -ContentType "application/json"
Connexion :

$body = '{"email":"client@test.com","password":"Test1234!"}'
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/auth/connexion/" -Method POST -Body $body -ContentType "application/json"
Profil (avec token) :

$headers = @{ Authorization = "Bearer <VOTRE_ACCESS_TOKEN>" }
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/auth/profil/" -Headers $headers
Réponse connexion (exemple testé) :


{
  "refresh": "eyJ...",
  "access": "eyJ...",
  "utilisateur": {
    "idUser": 1,
    "email": "client@test.com",
    "nom": "Sarr",
    "prenom": "Falilou",
    "role": "Client",
    "role_display": "Client",
    "telephone": "771234567"
  }
}

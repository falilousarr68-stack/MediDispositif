# MediDispositif API

API REST pour la gestion de vente de dispositifs médicaux développée par les étudiants en Licence 3 Informatique : **Falilou Sarr** et **Ousmane Fall**, sous la direction de **Monsieur Modou Gueye**.

## 📋 Table des matières

- [Technologies](#technologies)
- [Structure du projet](#structure-du-projet)
- [Installation](#installation)
- [Configuration](#configuration)
- [Endpoints API](#endpoints-api)
- [Rôles et Permissions](#rôles-et-permissions)
- [Commandes utiles](#commandes-utiles)

## 🛠 Technologies

- **Python 3.12+**
- **Django 5.0.7**
- **Django REST Framework 3.15.2**
- **djangorestframework-simplejwt 5.5.1**
- **django-cors-headers 4.4.0**
- **SQLite** (base de données par défaut)

## 📁 Structure du projet

```
medispositif_api/
├── authentication/          # Gestion des utilisateurs et authentification
│   ├── models.py           # Modèle Utilisateur avec Enum Role
│   ├── serializers.py      # Serializers pour inscription, login, profil
│   ├── views.py            # ViewSets pour authentification
│   ├── permissions.py      # Permissions personnalisées
│   └── urls.py             # Routes d'authentification
│
├── catalogue/              # Gestion du stock et catalogue
│   ├── models.py           # Catalogue, ProduitMedical, Approvisionnement, DetailsApprovisionnement
│   ├── serializers.py      # Serializers pour tous les modèles
│   ├── views.py            # ViewSets avec logique métier
│   ├── permissions.py      # Permissions Gestionnaire Stock
│   └── urls.py             # Routes catalogue
│
├── ventes/                 # Gestion des commandes et paiements
│   ├── models.py           # Commande, LigneCommande, Paiement, Facture
│   ├── serializers.py      # Serializers avec validators
│   ├── views.py            # ViewSets avec actions personnalisées
│   ├── permissions.py      # Permissions par rôle
│   └── urls.py             # Routes ventes
│
├── systeme/               # Paramètres système et rapports
│   ├── models.py           # ParametreSysteme, Rapport
│   ├── serializers.py      # Serializers spécialisés
│   ├── views.py            # ViewSets avec actions
│   ├── permissions.py      # Permissions Administrateur
│   └── urls.py             # Routes système
│
├── config/                 # Configuration Django
│   ├── settings.py         # Paramètres globaux
│   ├── urls.py             # URL racine
│   └── wsgi.py / asgi.py   # Configuration ASGI/WSGI
│
└── manage.py               # Script de gestion Django
```

## 🚀 Installation

### Prérequis

- Python 3.12 ou supérieur
- pip (gestionnaire de paquets Python)

### Étapes d'installation

1. **Cloner le dépôt**
```bash
git clone https://github.com/falilousarr68-stack/MediDispositif.git
cd MediDispositif/medispositif_api
```

2. **Créer un environnement virtuel (recommandé)**
```bash
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate
```

3. **Installer les dépendances**
```bash
pip install djangorestframework djangorestframework-simplejwt django-cors-headers
```

4. **Appliquer les migrations**
```bash
python manage.py migrate
```

5. **Créer un superutilisateur**
```bash
python manage.py createsuperuser
```

6. **Lancer le serveur de développement**
```bash
python manage.py runserver
```

Le serveur sera accessible sur `http://127.0.0.1:8000/`

## ⚙️ Configuration

### Variables d'environnement

Les paramètres sont configurés dans `config/settings.py` :

- **SECRET_KEY** : Clé secrète Django (à modifier en production)
- **DEBUG** : Mode de développement (True/False)
- **ALLOWED_HOSTS** : Hôtes autorisés
- **CORS_ALLOWED_ORIGINS** : Origines CORS pour le frontend

### Configuration JWT

```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': False,
    'AUTH_HEADER_TYPES': ('Bearer',),
}
```

## 📡 Endpoints API

### Authentication (`/api/auth/`)

| Méthode | Endpoint | Description | Permissions |
|---------|----------|-------------|--------------|
| POST | `/api/auth/register/` | Inscription d'un client | Public |
| POST | `/api/auth/login/` | Connexion (JWT) | Public |
| GET | `/api/auth/profile/` | Profil utilisateur | Authentifié |

**Exemple d'inscription :**
```json
POST /api/auth/register/
{
  "email": "client@example.com",
  "password": "password123",
  "nom": "Doe",
  "prenom": "John",
  "telephone": "+221771234567",
  "adresse": "Dakar, Sénégal"
}
```

**Exemple de connexion :**
```json
POST /api/auth/login/
{
  "email": "client@example.com",
  "password": "password123"
}
```

**Réponse :**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "role": "Client",
  "user": {
    "idUser": 1,
    "email": "client@example.com",
    "nom": "Doe",
    "prenom": "John"
  }
}
```

### Catalogue (`/api/catalogue/`)

| Méthode | Endpoint | Description | Permissions |
|---------|----------|-------------|--------------|
| GET | `/api/catalogue/catalogues/` | Liste des catalogues | Gestionnaire Stock |
| POST | `/api/catalogue/catalogues/` | Créer un catalogue | Gestionnaire Stock |
| GET | `/api/catalogue/produits/` | Liste des produits (avec filtres) | Public |
| POST | `/api/catalogue/produits/` | Créer un produit | Gestionnaire Stock |
| GET | `/api/catalogue/approvisionnements/` | Liste des approvisionnements | Gestionnaire Stock |
| POST | `/api/catalogue/approvisionnements/` | Créer un approvisionnement | Gestionnaire Stock |
| POST | `/api/catalogue/approvisionnements/{id}/ajouter-detail/` | Ajouter un détail | Gestionnaire Stock |
| GET | `/api/catalogue/details-approvisionnement/` | Liste des détails | Gestionnaire Stock |

**Filtres produits :**
- `?nom=xyz` : Recherche par nom
- `?catalogue=xyz` : Filtre par catalogue
- `?prix_min=1000` : Prix minimum
- `?prix_max=50000` : Prix maximum

### Ventes (`/api/ventes/`)

| Méthode | Endpoint | Description | Permissions |
|---------|----------|-------------|--------------|
| GET | `/api/ventes/commandes/` | Liste des commandes | Client/Vendeur/Resp. Com. |
| POST | `/api/ventes/commandes/` | Créer une commande | Client/Vendeur/Resp. Com. |
| GET | `/api/ventes/commandes/{id}/` | Détail commande | Propriétaire/Vendeur/Resp. |
| POST | `/api/ventes/commandes/{id}/valider/` | Valider une commande | Responsable Commercial |
| POST | `/api/ventes/commandes/{id}/annuler/` | Annuler une commande | Propriétaire/Resp. Com. |
| GET | `/api/ventes/lignes-commande/` | Liste des lignes | Propriétaire/Vendeur/Resp. |
| POST | `/api/ventes/lignes-commande/` | Ajouter une ligne | Propriétaire/Resp. Com. |
| GET | `/api/ventes/paiements/` | Liste des paiements | Vendeur/Resp. Com. |
| POST | `/api/ventes/paiements/` | Enregistrer un paiement | Vendeur/Resp. Com. |
| GET | `/api/ventes/factures/` | Liste des factures | Vendeur/Resp. Com. |
| POST | `/api/ventes/factures/` | Générer une facture | Vendeur/Resp. Com. |

**Exemple de création de commande :**
```json
POST /api/ventes/commandes/
{
  "lignes": [
    {
      "idProduit": 1,
      "quantite": 2,
      "prix_unitaire": 15000
    },
    {
      "idProduit": 3,
      "quantite": 1,
      "prix_unitaire": 25000
    }
  ]
}
```

**Validation de commande :**
```json
POST /api/ventes/commandes/{id}/valider/
```

**Annulation de commande :**
```json
POST /api/ventes/commandes/{id}/annuler/
{
  "motif": "Stock insuffisant"
}
```

### Système (`/api/systeme/`)

| Méthode | Endpoint | Description | Permissions |
|---------|----------|-------------|--------------|
| GET | `/api/systeme/parametres/` | Liste des paramètres | Administrateur |
| POST | `/api/systeme/parametres/` | Créer un paramètre | Administrateur |
| GET | `/api/systeme/parametres/par-nom/?nom=xxx` | Récupérer par nom | Administrateur |
| GET | `/api/systeme/rapports/` | Liste des rapports | Tous authentifiés |
| POST | `/api/systeme/rapports/` | Créer un rapport | Administrateur |
| GET | `/api/systeme/rapports/types/` | Types de rapports | Tous authentifiés |

**Filtres rapports :**
- `?type=Ventes` : Filtre par type
- `?date_debut=2024-01-01` : Date de début
- `?date_fin=2024-12-31` : Date de fin

## 👥 Rôles et Permissions

### Rôles disponibles

1. **Administrateur** : Accès complet à tous les modules
2. **Responsable Commercial** : Gestion des commandes, validation, annulation
3. **Vendeur** : Gestion des commandes et paiements
4. **Client** : Création de commandes, consultation de ses commandes
5. **Gestionnaire de Stock** : Gestion complète du catalogue et des approvisionnements

### Matrice des permissions

| Action | Admin | Resp. Com. | Vendeur | Client | Gest. Stock |
|--------|-------|------------|---------|--------|-------------|
| Authentification | ✅ | ✅ | ✅ | ✅ | ✅ |
| Catalogue (lecture) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Catalogue (écriture) | ✅ | ❌ | ❌ | ❌ | ✅ |
| Commandes (lecture) | ✅ | ✅ | ✅ | (propres) | ❌ |
| Commandes (création) | ✅ | ✅ | ✅ | ✅ | ❌ |
| Validation commande | ✅ | ✅ | ❌ | ❌ | ❌ |
| Annulation commande | ✅ | ✅ | ❌ | (propres) | ❌ |
| Paiements | ✅ | ✅ | ✅ | ❌ | ❌ |
| Factures | ✅ | ✅ | ✅ | ❌ | ❌ |
| Paramètres système | ✅ | ❌ | ❌ | ❌ | ❌ |
| Rapports (lecture) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Rapports (création) | ✅ | ❌ | ❌ | ❌ | ❌ |

## 🔧 Commandes utiles

### Gestion des migrations

```bash
# Créer des migrations
python manage.py makemigrations

# Appliquer les migrations
python manage.py migrate

# Vérifier l'état des migrations
python manage.py showmigrations
```

### Gestion du superutilisateur

```bash
# Créer un superutilisateur
python manage.py createsuperuser

# Changer le mot de passe d'un utilisateur
python manage.py changepassword <username>
```

### Serveur de développement

```bash
# Lancer le serveur (port 8000 par défaut)
python manage.py runserver

# Lancer sur un port spécifique
python manage.py runserver 8080

# Lancer avec accès externe
python manage.py runserver 0.0.0.0:8000
```

### Shell Django

```bash
# Ouvrir le shell Django
python manage.py shell

# Exemple de création d'utilisateur dans le shell
from authentication.models import Utilisateur, Role
admin = Utilisateur.objects.create_superuser(
    email='admin@example.com',
    password='admin123',
    nom='Admin',
    prenom='System',
    role=Role.ADMINISTRATEUR
)
```

### Tests

```bash
# Exécuter tous les tests
python manage.py test

# Exécuter les tests d'une application spécifique
python manage.py test authentication
python manage.py test catalogue
python manage.py test ventes
python manage.py test systeme
```

### Administration

```bash
# Accéder à l'interface d'administration
# URL: http://127.0.0.1:8000/admin/
```

## 📝 Logique métier

### Gestion automatique du stock

- **Approvisionnement** : L'ajout d'un `DetailsApprovisionnement` incrémente automatiquement le stock du produit
- **Validation commande** : Décrémente automatiquement le stock des produits (vérification disponibilité au préalable)
- **Annulation commande** : Remet le stock en place si la commande était validée

### Calculs automatiques

- **Montant ligne de commande** : Calculé automatiquement (quantité × prix_unitaire)
- **Montant total commande** : Recalculé automatiquement à chaque modification de lignes
- **Montant détail approvisionnement** : Calculé automatiquement (quantité × prix_unitaire_achat)
- **Numéro de facture** : Généré automatiquement (format: FAC-YYYYMMDD-XXXX)

### Contraintes métier

- **Stock insuffisant** : Empêche la création de lignes de commande si le stock est insuffisant
- **Validation commande** : Seules les commandes en cours peuvent être validées
- **Motif d'annulation** : Obligatoire pour le Responsable Commercial
- **Facture** : Ne peut être générée que pour une commande validée
- **Paramètres système** : Noms doivent être en snake_case

## 🔐 Sécurité

- **Authentification JWT** avec tokens d'accès et de rafraîchissement
- **Permissions granulaires** par rôle utilisateur
- **CORS** configuré pour le frontend
- **Validation des données** au niveau des serializers
- **Protection CSRF** activée

## 📚 Documentation additionnelle

- [Django Documentation](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Simple JWT](https://django-rest-framework-simplejwt.readthedocs.io/)

## 👨‍💻 Auteurs

- **Falilou Sarr** - Étudiant L3 Informatique
- **Ousmane Fall** - Étudiant L3 Informatique

## 👨‍🏫 Encadrement

- **Monsieur Modou Gueye** - Encadrant académique

## 📄 Licence

Ce projet a été réalisé dans le cadre d'un projet académique en Licence 3 Informatique.

---

**Dépôt GitHub** : https://github.com/falilousarr68-stack/MediDispositif.git

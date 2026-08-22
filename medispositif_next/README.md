# MediDispositif - Frontend Application

🏥 Plateforme E-commerce et de Gestion de Dispositifs Médicaux

## 📋 Contexte du Projet

Ce projet est réalisé par les étudiants en Licence 3 Informatique :

- **Falilou Sarr**
- **Ousmane Fall**

Sous la direction de leur encadrant :

- **Monsieur Modou Gueye**

## 🚀 Stack Technique

### Frontend

- **Framework** : Next.js 14+ (App Router, TypeScript)
- **Style & UI** : Tailwind CSS, Shadcn UI, Lucide Icons, Framer Motion
- **Thème** : `next-themes` (Dark/Light/System)
- **Internationalisation** : `next-intl` (Français 🇫🇷, Anglais 🇬🇧)
- **Gestion d'état** : TanStack React Query v5
- **HTTP Client** : Axios avec intercepteurs JWT
- **Formulaires** : React Hook Form + Zod
- **Notifications** : Sonner (React Hot Toast)

### Backend API

- **API Django REST** : http://127.0.0.1:8000/api/
- **Dépôt GitHub** : https://github.com/falilousarr68-stack/MediDispositif.git

## 📦 Installation

### Prérequis

- Node.js 18+
- npm ou yarn
- API Django en cours d'exécution sur http://127.0.0.1:8000/api/

### Étapes d'installation

1. **Cloner le dépôt**

```bash
git clone https://github.com/falilousarr68-stack/MediDispositif.git
cd medispositif_next
```

2. **Installer les dépendances**

```bash
npm install
```

3. **Configurer les variables d'environnement**
   Copier le fichier `.env.example` vers `.env` et configurer l'URL de l'API :

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api/
```

4. **Créer les utilisateurs de test (via shell Django)**

```bash
cd ../medispositif_api
python manage.py shell
```

Puis exécuter :

```python
from authentication.models import Utilisateur, Role

# Créer l'administrateur
admin = Utilisateur.objects.create_superuser(
    email='falilousarr68@gmail.com',
    password='Falilou7Sarr',
    nom='Sarr',
    prenom='Falilou',
    telephone='762064381'
)

# Créer le gestionnaire de stock
gestionnaire = Utilisateur.objects.create_user(
    email='ibrahima.ndiaye@medispositif.sn',
    password='Stock2024',
    nom='Ndiaye',
    prenom='Ibrahima',
    role=Role.GESTIONNAIRE_STOCK
)

# Créer le responsable commercial
commercial = Utilisateur.objects.create_user(
    email='fatou.badiane@medispositif.sn',
    password='Commercial2024',
    nom='Badiane',
    prenom='Fatou',
    role=Role.RESPONSABLE_COMMERCIAL
)

# Créer le vendeur
vendeur = Utilisateur.objects.create_user(
    email='cheikh.fall@medispositif.sn',
    password='Vendeur2024',
    nom='Fall',
    prenom='Cheikh Tidiane',
    role=Role.VENDEUR
)
```

5. **Lancer le serveur de développement**

```bash
npm run dev
```

L'application sera accessible sur http://localhost:3000

## 🏗️ Structure du Projet

```
medispositif_next/
├── src/
│   ├── app/                    # App Router Next.js
│   │   ├── [locale]/          # Routes avec internationalisation
│   │   │   ├── login/         # Page de connexion
│   │   │   ├── register/      # Page d'inscription
│   │   │   ├── dashboard/     # Dashboards par rôle
│   │   │   │   ├── admin/     # Dashboard administrateur
│   │   │   │   ├── stock/     # Dashboard gestionnaire de stock
│   │   │   │   ├── commercial/ # Dashboard responsable commercial
│   │   │   │   └── vendeur/   # Dashboard vendeur
│   │   │   └── page.tsx        # Page d'accueil
│   │   ├── layout.tsx         # Layout racine
│   │   └── globals.css        # Styles globaux
│   ├── components/            # Composants React
│   │   ├── ui/               # Composants UI (Shadcn)
│   │   ├── admin/            # Composants administrateur
│   │   ├── stock/            # Composants gestion stock
│   │   ├── providers/        # Providers (Theme, Query)
│   │   └── navbar.tsx        # Barre de navigation
│   ├── hooks/                 # Hooks personnalisés
│   │   ├── use-admin.ts      # Hooks pour administration
│   │   └── use-stock.ts      # Hooks pour gestion stock
│   ├── lib/                   # Utilitaires
│   │   ├── axios.ts          # Instance Axios avec intercepteurs
│   │   └── utils.ts          # Fonctions utilitaires
│   ├── types/                 # Types TypeScript
│   │   └── index.ts          # Interfaces et types
│   ├── messages/              # Fichiers de traduction
│   │   ├── fr.json           # Français
│   │   └── en.json           # Anglais
│   ├── i18n.ts               # Configuration i18n
│   └── middleware.ts         # Middleware Next.js
├── public/                   # Fichiers statiques
├── .env                      # Variables d'environnement
├── .env.example              # Exemple de variables
├── package.json              # Dépendances
├── tsconfig.json             # Configuration TypeScript
├── tailwind.config.ts        # Configuration Tailwind
└── next.config.js            # Configuration Next.js
```

## 🔐 Authentification & Sécurité

### Gestion JWT

- Tokens `access` et `refresh` stockés dans localStorage
- Intercepteur Axios pour injection automatique du token Bearer
- Rafraîchissement automatique du token en cas d'erreur 401
- Redirection vers login en cas d'échec du rafraîchissement

### Rôles Utilisateurs

- **Administrateur** 👑 → `/dashboard/admin` - Gestion complète des utilisateurs et système
- **ResponsableCommercial** 💼 → `/dashboard/commercial` - Gestion commerciale et clients
- **Vendeur** 🏷️ → `/dashboard/vendeur` - Gestion des ventes et commandes
- **GestionnaireDeStock** 📦 → `/dashboard/stock` - Gestion des stocks et dispositifs médicaux
- **Client** 🛒 → `/boutique` - Parcours client et achat de dispositifs

### Gestion des Utilisateurs

- **Dashboard Administrateur** : Interface complète pour gérer tous les utilisateurs
- **Création d'utilisateurs** : L'administrateur peut créer des comptes avec différents rôles
- **Inscription publique** : Le formulaire d'inscription publique ne permet que de créer des comptes "Client"
- **Suppression d'utilisateurs** : L'administrateur peut supprimer des comptes utilisateurs

### Comptes de Test

Les comptes suivants ont été créés pour tester le système :

| Rôle                      | Email                           | Mot de passe   | Dashboard               |
| ------------------------- | ------------------------------- | -------------- | ----------------------- |
| 👑 Administrateur         | falilousarr68@gmail.com         | Dakar2024      | `/dashboard/admin`      |
| 📦 Gestionnaire de Stock  | ibrahima.ndiaye@medispositif.sn | Stock2024      | `/dashboard/stock`      |
| 💼 Responsable Commercial | fatou.badiane@medispositif.sn   | Commercial2024 | `/dashboard/commercial` |
| 🏷️ Vendeur                | cheikh.fall@medispositif.sn     | Vendeur2024    | `/dashboard/vendeur`    |

### Structure des Dashboards

```
src/app/[locale]/dashboard/
├── admin/           # Dashboard administrateur
│   ├── page.tsx      # Page principale avec gestion des utilisateurs
│   └── ...           # Autres fonctionnalités admin
├── stock/            # Dashboard gestionnaire de stock
│   ├── page.tsx      # Page principale gestion stock
│   ├── products/     # Gestion des produits/dispositifs
│   └── supplies/     # Gestion des approvisionnements
├── commercial/       # Dashboard responsable commercial
│   └── page.tsx      # Page principale commercial
└── vendeur/          # Dashboard vendeur
    └── page.tsx      # Page principale vendeur
```

### Composants Admin

- **CreateUserDialog** : Formulaire de création d'utilisateur avec sélection de rôle
- **UserTable** : Tableau affichant tous les utilisateurs avec leurs rôles
- **use-admin** : Hooks personnalisés pour la gestion des utilisateurs (CRUD)

## 🌐 Internationalisation

L'application supporte deux langues :

- **Français** 🇫🇷 (langue par défaut)
- **Anglais** 🇬🇧

Le changement de langue se fait via le sélecteur dans la navbar.

## 🎨 Thème & UI

### Modes de thème

- ☀️ Mode Clair
- 🌙 Mode Sombre
- 💻 Système (suit les préférences du système)

### Composants UI

- Boutons, Inputs, Cards
- Navbar responsive
- Notifications Toast
- Animations Framer Motion

## 📝 Scripts Disponibles

```bash
npm run dev      # Serveur de développement
npm run build    # Build de production
npm run start    # Serveur de production
npm run lint     # Linter ESLint
```

## 🔗 API Endpoints

### Authentification

- `POST /api/auth/connexion/` - Connexion (note: utilise `email` et `password`)
- `POST /api/auth/inscription/` - Inscription publique (rôle Client automatique)
- `POST /api/auth/token/refresh/` - Rafraîchissement du token

### Catalogue

- `GET /api/catalogue/produits/` - Liste des produits
- `GET /api/catalogue/produits/{id}/` - Détail d'un produit

### Stock

- `GET /api/catalogue/` - Gestion du stock
- `POST /api/catalogue/approvisionnements/` - Approvisionnements

### Ventes

- `GET /api/ventes/commandes/` - Liste des commandes
- `POST /api/ventes/commandes/{id}/valider/` - Valider une commande
- `POST /api/ventes/commandes/{id}/annuler/` - Annuler une commande

### Administration

- `GET /api/auth/utilisateurs/` - Liste des utilisateurs
- `POST /api/auth/utilisateurs/` - Créer un utilisateur avec rôle spécifique
- `DELETE /api/auth/utilisateurs/{id}/` - Supprimer un utilisateur
- `PUT /api/auth/utilisateurs/{id}/` - Modifier un utilisateur

## 🎓 Encadrement Académique

**Université Cheikh Anta Diop (UCAD)**

- Licence 3 Informatique
- Encadreur : Monsieur Modou Gueye

## 📄 Licence

Ce projet est réalisé dans le cadre académique du projet de fin d'études en Licence 3 Informatique.

## 🤝 Contribution

Ce projet est développé par :

- Falilou Sarr
- Ousmane Fall

Pour toute question ou suggestion, veuillez contacter les développeurs ou l'encadreur académique.

## 📝 Dernières Modifications

### ✅ Mise à jour du système de gestion des utilisateurs (12/08/2026)

**Nouvelles fonctionnalités ajoutées :**

- ✨ Dashboard administrateur complet avec gestion des utilisateurs
- 🔐 Sécurité renforcée : l'inscription publique force le rôle "Client"
- 👥 Interface de création d'utilisateurs avec sélection de rôle
- 📊 Statistiques sur les utilisateurs par rôle
- 🗑️ Fonctionnalité de suppression d'utilisateurs

**Composants créés :**

- `src/app/[locale]/dashboard/admin/page.tsx` - Dashboard administrateur
- `src/hooks/use-admin.ts` - Hooks pour la gestion des utilisateurs
- `src/components/admin/create-user-dialog.tsx` - Formulaire de création utilisateur
- `src/components/admin/user-table.tsx` - Tableau des utilisateurs

**Comptes de test créés :**

- Administrateur : mamadou.diouf@medispositif.sn / Dakar2024
- Gestionnaire de Stock : ibrahima.ndiaye@medispositif.sn / Stock2024
- Responsable Commercial : fatou.badiane@medispositif.sn / Commercial2024
- Vendeur : cheikh.fall@medispositif.sn / Vendeur2024

**Bug fix :**

- 🐛 Correction de l'erreur de connexion : le formulaire envoyait `username` au lieu de `email` à l'API Django

**Flux utilisateur recommandé :**

1. L'administrateur se connecte et accède au dashboard admin
2. Il crée les utilisateurs nécessaires (Gestionnaire de Stock, Vendeur, etc.)
3. Chaque utilisateur se connecte avec son compte et accède à son dashboard spécifique
4. Le Gestionnaire de Stock peut ensuite ajouter des dispositifs médicaux

### ✅ Système d'upload d'images pour les produits (12/08/2026)

**Nouvelles fonctionnalités ajoutées :**

- 📷 Upload d'images pour les produits médicaux via formulaire
- 🖼️ Preview de l'image avant l'upload
- 🔒 Validation des fichiers (type image, max 5MB)
- 🎨 Interface utilisateur améliorée avec composant d'upload personnalisé
- 🔄 Support de FormData pour l'envoi de fichiers multipart

**Modifications backend :**

- Ajout du champ `image` au modèle `ProduitMedical` dans `catalogue/models.py`
- Configuration des fichiers médias dans `config/settings.py`
- Configuration des URLs pour servir les fichiers médias en développement
- Mise à jour des serializers pour inclure le champ image
- Migration de la base de données pour ajouter le champ image

**Composants créés :**

- `src/components/stock/image-upload.tsx` - Composant d'upload d'images avec preview
- Modification de `src/app/[locale]/dashboard/stock/products/new/page.tsx` - Formulaire de création avec upload
- Modification de `src/app/[locale]/dashboard/stock/products/[id]/page.tsx` - Formulaire d'édition avec upload
- Mise à jour de `src/hooks/use-stock.ts` - Support de FormData pour les mutations

**Champs ajustés pour correspondre au backend :**

- `name` → `nom`
- `price` → `prix`
- `category` → `catalogue`
- Ajout du champ `image` avec support de fichiers

**Fonctionnalités :**

- Upload d'images (PNG, JPG, GIF jusqu'à 5MB)
- Preview de l'image sélectionnée
- Possibilité de supprimer l'image sélectionnée
- Affichage de l'image actuelle lors de l'édition
- Validation des types et tailles de fichiers

**Configuration requise :**

- `MEDIA_URL = '/media/'` dans settings Django
- `MEDIA_ROOT` configuré pour stocker les fichiers uploadés
- Routes ajoutées pour servir les fichiers médias en développement

### ✅ Mise à jour des comptes utilisateurs avec noms sénégalais (13/08/2026)

**Nouveaux comptes créés avec des noms sénégalais réalistes :**

- 👑 Administrateur : Falilou Sarr (falilousarr68@gmail.com / Dakar2024) - **Téléphone: 762064381**
- 📦 Gestionnaire de Stock : Ibrahima Ndiaye (ibrahima.ndiaye@medispositif.sn / Stock2024)
- 💼 Responsable Commercial : Fatou Badiane (fatou.badiane@medispositif.sn / Commercial2024)
- 🏷️ Vendeur : Cheikh Tidiane Fall (cheikh.fall@medispositif.sn / Vendeur2024)

**Modifications effectuées :**

- Remplacement des anciens comptes de test par des noms sénégalais authentiques
- Mise à jour du README avec les nouvelles informations de connexion
- Création des nouveaux utilisateurs dans la base de données Django
- Conservation des comptes clients existants

**Comptes clients conservés :**

- antadiop10@gmail.com (Anta Diop)
- fallousarr10@gmail.com (Fallou Sarr)
- falilousarr195@gmail.com (Fallou Sarr)
- client@test.com (Falilou Sarr)

### ✅ Page de profil utilisateur avec statistiques (13/08/2026)

**Nouvelles fonctionnalités ajoutées :**

- 👤 Page de profil complète avec informations personnelles
- ✏️ Modification des informations utilisateur (nom, prénom, email, téléphone)
- � Upload de photo de profil avec preview
- �📊 Diagrammes statistiques des ventes par catégorie
- 📈 Diagramme en barres : produits vendus vs total disponibles
- 🥧 Diagramme circulaire : répartition des ventes par catégorie
- 🎨 Interface utilisateur moderne avec animations
- 👛 Bouton administrateur pour accéder au dashboard admin

**Composants créés :**

- `src/app/[locale]/profile/page.tsx` - Page de profil complète
- Intégration de Recharts pour les diagrammes statistiques
- Formulaire de modification avec validation Zod
- Avatar utilisateur avec initiales et upload de photo

**Fonctionnalités profil :**

- Affichage des informations personnelles (nom, prénom, email, téléphone, rôle)
- Modification des informations avec validation
- 📷 Upload de photo de profil avec preview
- Statistiques des ventes par catégorie de produits
- Diagrammes interactifs (barres et circulaire)
- Accès rapide au dashboard administrateur pour les admins

**Catégories de produits statistiques :**

- Cardiologie
- Neurologie
- Orthopédie
- Pneumologie
- Gastrologie

**Dépendance ajoutée :**

- Suppression de `recharts` (remplacé par des diagrammes CSS/SVG simples)

### ✅ Dashboard administrateur complet (13/08/2026)

**Nouvelles fonctionnalités ajoutées :**

- 🎯 Interface admin complète avec navigation latérale
- 👥 Gestion utilisateurs via endpoint `/api/auth/utilisateurs/`
- 📦 Catalogue (lecture et écriture) avec accès complet
- 🛒 Commandes (lecture, création, validation, annulation)
- 💳 Gestion des paiements via `/api/ventes/paiements/`
- 📄 Gestion des factures via `/api/ventes/factures/`
- ⚙️ Paramètres système via `/api/systeme/parametres/`
- 📊 Rapports (lecture et création) via `/api/systeme/rapports/`
- 🎨 Interface moderne avec icônes et animations
- 🔔 Notifications toast pour les actions
- 📈 Diagrammes CSS/SVG simples pour le profil (sans dépendance externe)
- 🔄 Redirection intelligente selon le rôle de l'utilisateur
- 🔧 Correction de l'accès administrateur aux commandes
- 🔧 Création automatique de paiements et factures lors de la validation de commande
- 🔧 Statistiques réelles depuis l'endpoint `/api/catalogue/statistiques/produits/`

**Sections du dashboard admin :**

- **Tableau de bord** : Vue d'ensemble avec statistiques réelles
- **Gestion utilisateurs** : Création, modification, suppression d'utilisateurs
- **Catalogue** : Accès complet aux produits (lecture/écriture)
- **Commandes** : Gestion complète avec validation et annulation
- **Paiements** : Liste et gestion des paiements
- **Factures** : Liste et génération des factures
- **Rapports** : Lecture et création de rapports avec types disponibles
- **Paramètres** : Configuration système

**Modifications des composants :**

- `src/app/[locale]/dashboard/admin/page.tsx` - Dashboard complet avec API réelles et boutons fonctionnels
- `src/hooks/use-admin.ts` - Hooks pour toutes les API backend avec gestion des formats de réponse
- `src/components/admin/create-user-dialog.tsx` - Formulaire adapté aux champs backend
- `src/components/admin/user-table.tsx` - Tableau avec mapping des IDs
- `src/app/[locale]/profile/page.tsx` - Diagrammes CSS/SVG simples et upload photo + statistiques réelles
- `src/app/[locale]/dashboard/stock/products/page.tsx` - Redirection intelligente selon rôle
- `src/app/[locale]/dashboard/stock/products/new/page.tsx` - Redirection intelligente selon rôle
- `src/app/[locale]/dashboard/stock/products/[id]/page.tsx` - Redirection intelligente selon rôle
- `package.json` - Suppression de la dépendance recharts

**Modifications backend (Django) :**

- `ventes/views.py` - Ajout de l'accès administrateur à toutes les commandes
- `ventes/permissions.py` - Ajout de l'administrateur dans les permissions de commande et paiements
- `ventes/views.py` - Logging de debug pour le queryset des commandes
- `ventes/models.py` - Création automatique de paiements et factures lors de la validation de commande
- `catalogue/views.py` - Endpoint statistiques pour les produits

**Endpoints API utilisés :**

- `POST /api/auth/utilisateurs/` - Création d'utilisateurs par l'admin
- `GET /api/auth/utilisateurs/` - Liste des utilisateurs
- `DELETE /api/auth/utilisateurs/{id}/` - Suppression d'utilisateurs
- `PUT /api/auth/utilisateurs/{id}/` - Modification d'utilisateurs
- `GET /api/ventes/commandes/` - Liste des commandes (admin peut voir toutes)
- `POST /api/ventes/commandes/{id}/valider/` - Validation de commande (crée paiement et facture automatiquement)
- `POST /api/ventes/commandes/{id}/annuler/` - Annulation de commande
- `GET /api/ventes/paiements/` - Liste des paiements
- `GET /api/ventes/factures/` - Liste des factures
- `GET /api/systeme/rapports/` - Liste des rapports
- `POST /api/systeme/rapports/` - Création de rapports
- `GET /api/systeme/rapports/types/` - Types de rapports disponibles
- `GET /api/systeme/parametres/` - Paramètres système
- `GET /api/catalogue/statistiques/produits/` - Statistiques des produits pour l'admin

### ✅ Correction de l'accès administrateur aux commandes (13/08/2026)

**Problème corrigé :**

- L'administrateur ne pouvait pas voir les commandes (affichage de 0)
- Les boutons "Voir toutes les commandes" et "Créer une commande" ne fonctionnaient pas

**Solutions apportées :**

- 🔧 **Backend** : Ajout de `Role.ADMINISTRATEUR` dans le queryset des commandes
- 🔧 **Permissions** : Ajout de l'administrateur dans les permissions de lecture et gestion
- 🔧 **Frontend** : Adaptation des boutons pour qu'ils fonctionnent avec notifications
- 🔧 **Format de réponse** : Gestion des différents formats de réponse API (array, paginated, etc.)
- 🔧 **Logging** : Ajout de logs de debug dans le backend pour le queryset

**Fonctionnalités des boutons :**

- **Voir toutes les commandes** : Affiche le nombre de commandes avec notification
- **Créer une commande** : Redirige vers la boutique avec notification explicative
- **Validation/Annulation** : Boutons fonctionnels avec notifications de succès/erreur

### ✅ Correction de la redirection intelligente (13/08/2026)

**Problème corrigé :**

- L'administrateur était redirigé vers le dashboard de gestionnaire de stock au lieu de son propre dashboard
- Les boutons "Retour au tableau de bord" redirigent maintenant selon le rôle de l'utilisateur connecté

**Pages modifiées :**

- `src/app/[locale]/dashboard/stock/products/page.tsx` - Retour vers dashboard du rôle actuel
- `src/app/[locale]/dashboard/stock/products/new/page.tsx` - Annulation vers dashboard du rôle actuel
- `src/app/[locale]/dashboard/stock/products/[id]/page.tsx` - Retour et annulation vers dashboard du rôle actuel

**Fonctionnalité ajoutée :**

- Détection automatique du rôle via localStorage
- Redirection intelligente :
  - Administrateur → `/dashboard/admin`
  - Responsable Commercial → `/dashboard/commercial`
  - Vendeur → `/dashboard/vendeur`
  - Gestionnaire de Stock → `/dashboard/stock`
  - Client → `/boutique`

### ✅ Correction des diagrammes du profil administrateur (13/08/2026)

**Nouveaux diagrammes :**

- 🔧 **Diagramme en barres verticales** : Affiche chaque produit avec le nombre vendu vs stock total
- 🔧 **Diagramme circulaire global** : Affiche le total des produits vendus vs stock restant du catalogue
- 🔧 **Données réelles** : Utilisation de l'endpoint `/api/catalogue/statistiques/produits/`

**Fonctionnalités :**

- **Barres verticales** : Limitées à 10 produits pour l'affichage avec indicateur si plus de produits
- **Diagramme circulaire** : Affiche les pourcentages et les valeurs réelles
- **Données par défaut** : Affichage neutre si aucune donnée disponible

### ✅ Migration vers useState/useEffect (14/08/2026)

**Migration effectuée :**

- 🔧 **Dashboard admin** : Migration de `useReportTypes` et `useSystemParams` vers useState/useEffect
- 🔧 **Données simples** : Types de rapports et paramètres système gérés avec useEffect
- 🔧 **Gardé React Query** : Données complexes (utilisateurs, commandes, paiements, factures)
- 🔧 **Performance** : Réduction des requêtes inutiles pour les données statiques

**Justification de la migration :**

- **Données statiques** : Les types de rapports et paramètres système changent rarement
- **État local** : Pas besoin de cache complexe pour ces données
- **Simplicité** : useState/useEffect plus simple pour les données de configuration

### ✅ Envoi d'emails pour les factures (14/08/2026)

**Fonctionnalité implémentée :**

- 🔧 **Configuration SMTP** : Ajoutée dans settings.py (Gmail par défaut)
- 🔧 **Template email** : Template HTML professionnel pour les factures
- 🔧 **Signal Django** : Envoi automatique après création de facture
- 🔧 **Informations détaillées** : Détails de la commande et lignes de commande

**Configuration email dans settings.py :**

- EMAIL_BACKEND : django.core.mail.backends.smtp.EmailBackend
- EMAIL_HOST : smtp.gmail.com (configurable)
- EMAIL_PORT : 587
- EMAIL_USE_TLS : True
- DEFAULT_FROM_EMAIL : MediDispositif <noreply@medispositif.sn>

**Template email créé :**

- `templates/emails/facture_email.html` : Template HTML professionnel
- Informations : Client, numéro de facture, date, montant, détails de commande
- Design : CSS intégré pour un rendu professionnel

**Signal automatique :**

- Déclenchement : Après création de facture
- Contenu : Email HTML avec tous les détails de la facture
- Gestion d'erreur : fail_silently=True pour ne pas bloquer le processus

### ✅ Amélioration de l'interface des paramètres (14/08/2026)

**Nouvelle interface de paramètres :**

- 🔧 **Configuration Email** : Activation/désactivation de l'envoi automatique
- 🔧 **Informations entreprise** : Nom, adresse, téléphone, email de contact
- 🔧 **Paramètres système** : Affichage des paramètres existants
- 🔧 **Formulaire complet** : Interface pour configurer tous les paramètres

**Sections de paramètres :**

- **Configuration Email** :
  - Activation/désactivation de l'envoi automatique
  - Adresse email d'envoi
  - Préfixe des sujets d'emails
- **Informations de l'entreprise** :
  - Nom de l'entreprise
  - Adresse
  - Téléphone
  - Email de contact
- **Paramètres actuels** : Affichage des paramètres existants du système

**Problèmes corrigés :**

- Les paiements et factures s'affichaient à 0 même après validation des commandes
- La création de rapports échouait avec "Erreur de création"
- Les statistiques étaient nulles malgré des commandes effectuées

**Solutions apportées :**

- 🔧 **Backend** : Création automatique de paiements et factures lors de la validation de commande
- 🔧 **Permissions** : Ajout de l'administrateur dans les permissions de paiements
- 🔧 **Rapports** : Correction du champ `description` en `commentaires` selon le serializer
- 🔧 **Statistiques** : Implémentation des statistiques réelles depuis l'endpoint API
- 🔧 **Logging** : Ajout de logs de debug pour le diagnostic

**Fonctionnalités automatiques :**

- **Validation de commande** : Crée automatiquement un paiement (espèces) et une facture
- **Statistiques** : Affiche les vraies données de ventes par catalogue
- **Rapports** : Création fonctionnelle avec les bons champs

**Modifications des composants :**

- `src/app/[locale]/dashboard/admin/page.tsx` - Dashboard complet avec navigation
- `src/hooks/use-admin.ts` - Mise à jour des champs (nom, prenom, telephone)
- `src/components/admin/create-user-dialog.tsx` - Formulaire avec champs français
- `src/components/admin/user-table.tsx` - Tableau avec champs français

**Endpoint API utilisé :**

- `POST /api/auth/utilisateurs/` - Création d'utilisateurs par l'admin
- `GET /api/auth/utilisateurs/` - Liste des utilisateurs
- `DELETE /api/auth/utilisateurs/{id}/` - Suppression d'utilisateurs
- `PUT /api/auth/utilisateurs/{id}/` - Modification d'utilisateurs

**Sections du dashboard admin :**

- **Tableau de bord** : Vue d'ensemble avec statistiques
- **Gestion utilisateurs** : Création, modification, suppression d'utilisateurs
- **Catalogue** : Accès complet aux produits (lecture/écriture)
- **Commandes** : Gestion complète des commandes
- **Paiements** : Gestion des modes de paiement
- **Factures** : Génération et gestion des factures
- **Rapports** : Lecture et création de rapports
- **Paramètres** : Configuration système

# Diagrammes PlantUML - MediDispositif

Ce dossier contient les diagrammes UML du projet MediDispositif générés à partir de l'analyse du code source.

## Diagrammes disponibles

### 1. Diagramme de Classes (`diagramme_classes.puml`)
Représente la structure statique du système avec :
- **Entités** : User, Product, CartItem, Order, Supply, Payment
- **Types** : LoginCredentials, RegisterData, AuthResponse
- **Hooks** : UseCart, UseProducts, UseStock, UseSales, UseAdmin
- **Services** : AxiosService, OrderService
- **Composants** : HomePage, BoutiquePage, ProductGrid, CartPage, AdminDashboardPage, etc.

### 2. Diagramme de Cas d'Utilisation (`diagramme_cas_utilisation.puml`)
Représente les fonctionnalités du système vues par les utilisateurs :
- **Acteurs** : Client, Vendeur, ResponsableCommercial, GestionnaireStock, Administrateur
- **Cas d'utilisation regroupés par module** :
  - Authentification (47 cas)
  - Catalogue Produits
  - Gestion Panier
  - Gestion Commandes
  - Gestion Paiements
  - Gestion Factures
  - Gestion Stock
  - Administration
  - Rapports & Statistiques

### 3. Diagramme d'Activité (`diagramme_activite.puml`)
Représente les flux de processus métier :
- Processus d'achat client
- Processus de validation commande (Admin/Vendeur)
- Processus de gestion stock
- Processus de gestion utilisateurs (Admin)
- Processus de génération rapports

## Comment visualiser les diagrammes

### Option 1: Utiliser un éditeur en ligne
1. Allez sur [PlantText](https://www.planttext.com/) ou [PlantUML Online Editor](https://plantuml-editor.kkeisuke.com/)
2. Copiez le contenu du fichier `.puml`
3. Collez-le dans l'éditeur
4. Le diagramme sera généré automatiquement

### Option 2: Utiliser VS Code
1. Installez l'extension "PlantUML" depuis le marketplace
2. Ouvrez un fichier `.puml`
3. Appuyez sur `Alt+D` pour prévisualiser le diagramme

### Option 3: Utiliser la ligne de commande
```bash
# Installer PlantUML (nécessite Java)
# Téléchargez plantuml.jar depuis https://plantuml.com/download

# Générer un diagramme PNG
java -jar plantuml.jar diagramme_classes.puml

# Générer un diagramme SVG
java -jar plantuml.jar -tsvg diagramme_classes.puml

# Générer tous les diagrammes
java -jar plantuml.jar *.puml
```

### Option 4: Utiliser un IDE JetBrains
1. Installez le plugin "PlantUML integration"
2. Ouvrez un fichier `.puml`
3. Cliquez droit sur le fichier et sélectionnez "Show Diagram"

## Structure du projet reflétée

Les diagrammes sont basés sur l'architecture actuelle du projet :

### Technologies utilisées
- **Frontend** : Next.js 14, React 18, TypeScript
- **State Management** : Zustand (panier), TanStack Query (API)
- **UI** : Tailwind CSS, Radix UI, Framer Motion
- **API Client** : Axios
- **Internationalisation** : next-intl

### Structure des dossiers
```
src/
├── app/[locale]/           # Pages Next.js
│   ├── boutique/          # Catalogue produits
│   ├── cart/              # Panier
│   ├── checkout/          # Processus commande
│   ├── dashboard/         # Tableaux de bord par rôle
│   │   ├── admin/         # Administration
│   │   ├── commercial/    # Responsable commercial
│   │   ├── vendeur/       # Vendeur
│   │   └── stock/         # Gestionnaire stock
│   ├── login/             # Authentification
│   └── register/          # Inscription
├── components/            # Composants React
│   ├── admin/             # Composants admin
│   ├── products/          # Composants produits
│   ├── sales/             # Composants ventes
│   ├── stock/             # Composants stock
│   └── ui/                # Composants UI réutilisables
├── hooks/                 # Custom React Hooks
│   ├── use-admin.ts       # Hooks admin
│   ├── use-cart.ts        # Hook panier (Zustand)
│   ├── use-products.ts    # Hooks produits
│   ├── use-sales.ts       # Hooks ventes
│   └── use-stock.ts       # Hooks stock
├── lib/                   # Utilitaires
│   ├── axios.ts           # Configuration API
│   └── orders.ts          # Services commandes
└── types/                 # Types TypeScript
    └── index.ts           # Interfaces principales
```

## Notes techniques

### Architecture des Hooks
- **TanStack Query** : Utilisé pour la gestion du cache API et les mutations
- **Zustand** : Utilisé pour la gestion d'état local du panier avec persistance localStorage
- **React Hook Form** : Utilisé pour la gestion des formulaires

### API Endpoints (Django Backend)
Les diagrammes reflètent les endpoints API suivants :
- `api/auth/utilisateurs/` - Gestion utilisateurs
- `api/catalogue/produits/` - Catalogue produits
- `api/catalogue/approvisionnements/` - Approvisionnements
- `api/ventes/panier/` - Gestion panier
- `api/ventes/commandes/` - Gestion commandes
- `api/ventes/paiements/` - Gestion paiements
- `api/ventes/factures/` - Gestion factures
- `api/systeme/rapports/` - Rapports et statistiques

### Rôles utilisateurs
Le système implémente 5 rôles avec des permissions différentes :
1. **Client** : Achat, consultation panier, suivi commandes
2. **Vendeur** : Validation commandes, consultation historique ventes
3. **ResponsableCommercial** : Validation commandes, annulation commandes, rapports ventes
4. **GestionnaireDeStock** : Gestion produits, approvisionnements, alertes
5. **Administrateur** : Accès complet, gestion utilisateurs, configuration, gestion paiements et factures

## Maintenance

Pour mettre à jour ces diagrammes après des modifications du code :
1. Analysez les nouveaux fichiers ou modifications
2. Mettez à jour les fichiers `.puml` correspondants
3. Régénérez les images si nécessaire
4. Documentez les changements dans ce README

## Auteur

Diagrammes générés automatiquement basés sur l'analyse du code source du projet MediDispositif (Next.js + Django).

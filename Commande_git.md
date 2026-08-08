1. Initialisation & Configuration de base

À exécuter une seule fois au début de votre projet (dans le terminal de Cursor).

# Lier votre dossier local au dépôt GitHub

git remote add origin https://github.com/falilousarr68-stack/MediDispositif.git

# Vérifier la liaison vers le dépôt distant

git remote -v

2. Liaison avec un Dépôt GitHub Distant (Remote)

Après avoir créé un dépôt vide sur GitHub.com :

# Lier votre dossier local au dépôt GitHub

git remote add origin https://github.com/votre-compte/votre-depot.git

# Vérifier la liaison vers le dépôt distant

git remote -v

3. Flux de Travail Quotidien (Le cycle d'enregistrement)

À répéter à chaque fois que vous terminez une étape ou une fonctionnalité dans Cursor.

# 1. Vérifier l'état des fichiers (modifiés, ajoutés ou non suivis)

git status

# 2. Ajouter tous les fichiers modifiés à la zone de préparation (staging)

git add .

# 3. Valider les modifications avec un message clair

git commit -m "Etape 1: Configuration initiale de l'API et authentification JWT"

# 4. Envoyer les commits vers GitHub

git push -u origin main
Note : Le paramètre -u origin main n'est nécessaire que lors du tout premier push. Par la suite, la commande git push suffit.

4. Travail en Équipe & Branches (Idéal pour travailler avec Ousmane Fall)

Pour éviter de bloquer la branche principale (main) pendant le développement d'un module spécifique.

# Créer et basculer sur une nouvelle branche (ex: module authentification)

git checkout -b feature/auth

# Lister toutes les branches existantes

git branch

# Basculer vers une branche existante

git checkout main

# Récupérer et fusionner les modifications de la branche feature dans main

git checkout main
git merge feature/auth

# Supprimer une branche locale une fois fusionnée

git branch -d feature/auth

5. Synchronisation & Récupération des Changements

Si votre binôme a envoyé du code sur GitHub ou si vous travaillez depuis une autre machine.

# Récupérer et fusionner le code distant vers votre local

git pull origin main

# Consulter l'historique des commits effectués

git log --oneline

6. Annulation & Correction d'Erreurs

# Annuler les modifications non validées d'un fichier

git checkout -- nom_du_fichier.py

# Retirer un fichier de la zone de préparation (unstage)

git restore --staged nom_du_fichier.py

# Modifier le message du tout dernier commit

git commit --amend -m "Nouveau message de commit"

💡 Astuce essentielle pour votre projet Django :

Avant de faire votre premier git add ., créez un fichier nommé .gitignore à la racine de votre projet et ajoutez-y ces lignes pour éviter d'envoyer des fichiers inutiles ou sensibles sur GitHub :

\*.pyc
**pycache**/
venv/
.env
db.sqlite3
.vscode/
.cursor/

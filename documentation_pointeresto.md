# 🍽️ PointeResto

![PHP](https://img.shields.io/badge/PHP-8.3-777BB4?style=flat-square&logo=php&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF?style=flat-square&logo=githubactions&logoColor=white)

**PointeResto** est une application web full-stack de découverte gastronomique et de gestion d'établissements à **Pointe-Noire (République du Congo)**. Elle permet aux visiteurs d'explorer les restaurants par quartier, de consulter les cartes et les avis, et aux restaurateurs de gérer leurs établissements et leurs plats depuis un espace sécurisé.

🌐 **Application en ligne :** [https://k-marcos01.github.io/PointeResto/](https://k-marcos01.github.io/PointeResto/)  
🩺 **Statut de l'API (Healthcheck) :** [https://pointerestobackend.onrender.com/Index.php?route=health](https://pointerestobackend.onrender.com/Index.php?route=health)

---

## 🏗️ 1. Architecture et Déploiement en Production

L'application repose sur une architecture découplée en trois tiers hébergée sur des services cloud managés :

| Couche | Technologies | Hébergement | Point d'accès / Détails |
| :--- | :--- | :--- | :--- |
| **Front-End** | HTML5, CSS3, JavaScript ES6+ | **GitHub Pages** | `https://k-marcos01.github.io/PointeResto/` (entrée via `index.html` vers `Frontend/Connexion.html`) |
| **Back-End (API)** | PHP 8.3, Nginx, Docker | **Render** (Frankfurt) | `https://pointerestobackend.onrender.com` (route de santé : `/Index.php?route=health`) |
| **Base de données** | PostgreSQL 16 | **Neon** (Frankfurt) | Base serverless `neondb` (6 tables relationnelles + 20 établissements préchargés) |
| **Cache & CI/CD** | Cache fichier / Redis, GitHub Actions | **GitHub** | Validation automatique à chaque `push` sur `main` et déploiement continu |

---

## 📁 2. Structure du Dépôt et Modèle de Données

L'arborescence sépare strictement l'interface client, l'API serveur, les scripts SQL et l'automatisation DevOps :

```text
PointeResto/
├── .github/workflows/       # Pipeline CI/CD (linting, sécurité .env, qualité HTML/CSS)
├── Backend/                 # API REST PHP 8.3, contrôleurs, middlewares JWT/CORS, CacheService
│   └── Index.php            # Point d'entrée unique routant les requêtes (?route=...)
├── Frontend/                # Pages HTML, feuilles de style CSS et scripts clients
│   ├── Assets/JS/api.js     # Client Fetch centralisé et gestion du jeton JWT
│   └── Connexion.html       # Page d'authentification et accès visiteur
├── database/
│   └── migration.sql        # Schéma PostgreSQL 16 et jeu de données initial (20 restaurants)
├── Dockerfile               # Image de production Nginx + PHP-FPM 8.3
├── docker-compose.yml       # Orchestration locale (API + PostgreSQL)
├── index.html               # Redirection racine pour GitHub Pages
└── README.md                # Documentation technique du projet
```

### Schéma relationnel PostgreSQL (`database/migration.sql`)

* **`utilisateurs` :** comptes clients et restaurateurs (mots de passe hachés, rôles RBAC).
* **`workspaces` :** espaces de gestion rattachés aux propriétaires d'établissements.
* **`restaurants` :** fiches des 20 établissements de Pointe-Noire (nom, quartier, adresse, description, horaires).
* **`menus` :** plats associés à chaque restaurant (nom, prix, catégorie, composition).
* **`avis` :** notes et commentaires publiés par les utilisateurs authentifiés.
* **`medias` :** ressources visuelles associées aux restaurants et aux plats.

---

## ⚙️ 3. Configuration et Exécution Locale

### Variables d'environnement requises

Créez un fichier `.env` local (ignoré par Git) ou configurez ces variables dans votre hébergeur cloud :

| Variable | Exemple / Valeur de production | Rôle |
| :--- | :--- | :--- |
| `APP_ENV` | `production` (ou `development`) | Active le mode production et masque les traces d'erreur détaillées |
| `APP_SECRET` | Chaîne hexadécimale de 64 caractères | Clé cryptographique servant à signer et vérifier les jetons JWT |
| `DATABASE_URL` | `postgresql://user:pass@host/neondb?sslmode=require` | Chaîne de connexion complète vers PostgreSQL 16 |
| `CORS_ORIGIN` | `https://k-marcos01.github.io` | Origine autorisée dans l'en-tête `Access-Control-Allow-Origin` |
| `REDIS_URL` | *(Optionnel)* `redis://...` | Active le cache distribué (bascule sur le cache fichier local si absent) |

### Lancement en environnement local avec Docker

1. **Cloner le dépôt et démarrer les conteneurs :**
   ```bash
   git clone https://github.com/k-marcos01/PointeResto.git
   cd PointeResto
   docker compose up -d --build
   ```

2. **Initialiser ou réinitialiser la base de données PostgreSQL :**
   ```bash
   docker compose exec db psql -U postgres -d pointeresto -v ON_ERROR_STOP=1 -f /docker-entrypoint-initdb.d/01-migration.sql
   ```

3. **Vérifier l'API locale :**
   Ouvrez [http://localhost:8080/Index.php?route=health](http://localhost:8080/Index.php?route=health) pour confirmer la réponse `{"status":"ok"}`.

---

## 🔌 4. API REST, Sécurité et Pipeline CI/CD

### Endpoints principaux (`Backend/Index.php`)

* **Santé et diagnostic :**
  * `GET /Index.php?route=health` — vérifie la disponibilité de l'API et la connexion à PostgreSQL.
* **Catalogue public :**
  * `GET /Index.php?route=restaurants&action=list` — liste les établissements (filtrable par quartier ou recherche).
  * `GET /Index.php?route=restaurants&action=quartiers` — retourne la liste des quartiers couverts à Pointe-Noire.
  * `GET /Index.php?route=menus&restaurant_id={id}` — récupère la carte et la composition des plats d'un établissement.
* **Authentification et gestion (JWT requis via `Authorization: Bearer <token>`) :**
  * `POST /Index.php?route=auth&action=login` et `action=register` — authentification, inscription et génération du jeton JWT.
  * `POST /Index.php?route=avis` — publication d'un avis et d'une note client.
  * `POST / PUT / DELETE /Index.php?route=menus` — création, modification et suppression des plats par le restaurateur propriétaire.

### Sécurité et Contrôle d'Accès (RBAC)

* **Trois niveaux d'autorisation :**
  1. **Visiteur :** consultation libre des établissements, quartiers, menus et avis.
  2. **Client authentifié :** publication d'avis et gestion de session personnelle.
  3. **Restaurateur :** administration complète des cartes et plats rattachés à son espace (`workspace`).
* **Compte de démonstration restaurateur :**
  * **Identifiant :** `patrick.ngoma@gmail.com`
  * **Mot de passe :** `PointeResto2026`
* **Politique CORS stricte :** validation des requêtes pré-vol (`OPTIONS`) et restriction stricte des origines via la variable `CORS_ORIGIN`.

### Pipeline CI/CD (GitHub Actions)

À chaque `push` ou `pull_request` sur la branche `main`, le pipeline automatisé exécute les vérifications suivantes avant le déploiement :
* **Sécurité :** blocage immédiat si un fichier `.env` est suivi par Git.
* **Qualité Back-End :** vérification syntaxique PHP (`php -l`) sur l'ensemble des fichiers serveur.
* **Qualité Front-End :** contrôle de l'absence d'attributs `style=` inline dans `Frontend/*.html`.

### Je vous invite à tester 
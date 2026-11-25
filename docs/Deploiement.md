# Guide de Déploiement et d'Exploitation — PointeResto

## 1. Architecture de déploiement
- **Front-End (Statique) :** déployé sur **GitHub Pages** depuis le dossier `Frontend/`.
- **Back-End (API REST PHP 8 POO) :** conteneurisé via `Backend/Dockerfile` et déployé sur **Railway**.
- **Persistance & Cache :** base relationnelle **PostgreSQL** (connexion SSL obligatoire via `DATABASE_URL`) et service clé-valeur **Redis** sur Railway.

## 2. Installation locale reproductible (Docker)
1. Cloner le dépôt et copier la configuration type :
   `cp .env.example .env`
2. Démarrer les trois services (`backend`, `db`, `redis`) :
   `docker compose up -d --build`
3. Vérifier l'initialisation automatique de PostgreSQL (6 tables + 20 établissements) :
   `docker compose exec backend php tests/run_tests.php`
4. L'API REST est accessible sur `http://localhost:8000` et le Front-End via un serveur statique sur `http://localhost:8080`.

## 3. Déploiement en production (Railway & GitHub Pages)
### Back-End & Base de données (Railway)
1. Créer un projet Railway connecté au dépôt GitHub (`PointeResto`) pointant sur le répertoire `Backend/`.
2. Provisionner les services managés **PostgreSQL** et **Redis**.
3. Configurer les variables d'environnement dans Railway :
   - `APP_ENV=production`
   - `DATABASE_URL` (référence interne Railway avec paramètre SSL actif)
   - `REDIS_URL` (référence interne Redis)
   - `CORS_ORIGIN=https://<votre-utilisateur>.github.io`
4. Initialiser le schéma de production :
   `DATABASE_URL="<url_production>" ./database/restore.sh database/migration.sql`

### Front-End (GitHub Pages)
1. Renseigner l'URL publique HTTPS de l'API Railway dans `Frontend/js/api.js`.
2. Publier la branche `main` (dossier `/Frontend`) via GitHub Pages.

## 4. Sauvegarde, supervision et retour arrière (Rollback)
- **Sauvegarde avant mise à jour :** `./database/backup.sh` génère un dump horodaté dans `database/backups/`.
- **Rollback applicatif :** redéploiement instantané du commit stable précédent depuis l'historique des déploiements Railway et GitHub Pages.
- **Rollback base de données :** `./database/restore.sh database/backups/pointeresto_<horodatage>.sql`.
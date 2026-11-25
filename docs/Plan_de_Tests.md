# Plan de Tests & Cahier de Recettes — PointeResto

## 1. Stratégie de test
- **Tests unitaires & sécurité applicative :** validation des contrôleurs et services PHP 8 (`MediaController`, `AuthController`, `ReviewController`, `CacheService`).
- **Tests d'intégrité base de données :** vérification des contraintes relationnelles PostgreSQL (`CHECK`, clés étrangères, index et transactions PDO).
- **Tests d'intégration API REST :** vérification des routes HTTP (`GET`, `POST`, `PUT`, `DELETE`), des codes de statut (`200`, `201`, `400`, `401`, `403`, `415`) et des en-têtes CORS.

## 2. Cahier de recettes & Jeu d'essai représentatif

| ID | Catégorie | Scénario testé | Données d'entrée | Résultat attendu | Résultat obtenu | Statut |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-01** | Fonctionnel | Recherche d'établissement par quartier et plat | `GET /api/restaurants?workspace_id=1&q=poisson` | Liste JSON filtrée avec note moyenne calculée et statut d'ouverture | Liste JSON conforme avec `note_moyenne` | **OK** |
| **TC-02** | Fonctionnel | Mémorisation hors-ligne des favoris | Clic sur « Favori » sur *La Paillote* (`Index.html`) | Clé `pointeresto_favorites` mise à jour dans `localStorage` et épinglée en haut | Établissement épinglé après rechargement | **OK** |
| **TC-03** | Sécurité (Auth) | Connexion utilisateur avec mot de passe valide | `POST /api/auth/login` (`email` + mot de passe valide) | Vérification `password_verify()` réussie, HTTP `200` + jeton/session | HTTP `200` et accès au rôle attribué | **OK** |
| **TC-04** | Sécurité (RBAC) | Accès non authentifié à la gestion restaurateur | `POST /api/workspaces/1/restaurants/manage` sans jeton | Blocage par contrôleur, HTTP `401 Unauthorized` | HTTP `401` retourné | **OK** |
| **TC-05** | Sécurité (SQLi) | Tentative d'injection SQL dans la barre de recherche | `q=' OR 1=1 --` sur `GET /api/restaurants` | Requête paramétrée PDO neutralise la chaîne, aucun dump SQL | Tableau vide `[]` et HTTP `200` | **OK** |
| **TC-06** | Sécurité (Upload) | Envoi d'un script PHP déguisé en image JPEG | Fichier `shell.php` renommé `plat.jpg` sur `MediaController` | Détection `mime_content_type()` (`text/x-php`), rejet HTTP `415` | Fichier rejeté, HTTP `415` | **OK** |
| **TC-07** | Sécurité (Spam) | Dépôt massif d'avis depuis une même adresse IP | > 5 requêtes `POST /api/reviews` en moins d'1 minute | Enregistrement IP et limitation anti-spam, HTTP `429` | Blocage anti-spam actif | **OK** |
| **TC-08** | BDD (Intégrité) | Insertion d'une note hors bornes dans `avis` | `INSERT INTO avis (..., note) VALUES (..., 7)` | Rejet par contrainte PostgreSQL `CHECK (note BETWEEN 1 AND 5)` | Violation contrainte `avis_note_check` | **OK** |
| **TC-09** | BDD / Cache | Création transactionnelle restaurant + menu | `createWithInitialMenuAndMedia()` avec erreur sur le menu | `rollBack()` complet (aucun restaurant orphelin) + cache Redis intact | Intégrité transactionnelle vérifiée | **OK** |
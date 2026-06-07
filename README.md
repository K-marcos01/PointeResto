Projet de plateforme de découverte et de référencement gastronomique pour Pointe-Noire.

Jour 1 : 
1. Ajout du cahier de charge

2. Ajout du dossier docs
Ce dossier contient tous les éléments de la modélisation à savoir :
a. Diagramme des cas d'utilisation (Identification des acteurs)
b. Le MCD (Interprètation du UseCase diagram)
c. Le MPD relatif au PostgreSQL (Complément du MCD)

3. Passage à la structure générale du projet. Les dossiers principaux sont:
    docs/ : Modélisations conceptuelle et physique (MCD/MPD StarUML).
    backend/ : API REST en PHP orienté objet et gestion de la base de données.
    frontend/ : Interface publique et mobile-first (HTML5, CSS3, JavaScript Vanilla)
    README.md

Jour 2 : 
4. Création de la base de données et des tables conforme à la modélisation sur pgAdmin

5. Insertion d'éléments dans chacune des tables

6. Connexion à la base de données.

7. Base de données
Le projet utilise PostgreSQL pour assurer la robustesse des relations complexes.
Le dictionnaire de données comprend 6 tables principales :
 "utilisateurs" : Gestion des comptes (Clients, Restaurateurs, Modérateurs).
 "workspaces" : Découpage par zones géographiques de la ville.
 "restaurants" : Informations sur les établissements référencés.
 "menus" : Plats et formules rattachés aux restaurants.
 "avis" : Notes et commentaires avec sécurité anti-spam intégrée.
 "medias" : Photos et fichiers téléversés de manière sécurisée.

 8. api/
       |- get_restaurants.php (Récupération + filtres des restos)
       |- get_workspaces.php (Liste des quartiers pour les filtres)
       |- post_avis.php (Ajout d'avis avec sécurité IP)
       |- upload_media.php (Vérification MIME stricte des photos)

9. frontend/
            |-js/
                |- api.js (Fonctions fetch() vers le backend)
                |- dom.js (Injection des cartes restos dans le HTML)
                |- filters.js (Gestion des filtres par quartier/spécialité)
                |- favorites.js (Logique localStorage pour les favoris)
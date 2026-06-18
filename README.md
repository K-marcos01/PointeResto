I. PointeResto - Plateforme Gastronomique de Pointe-Noire

PointeResto est une application web full-stack Mobile-First dédiée au 
référencement, à la recherche et à l'évaluation des restaurants, maquis 
et fast-foods de la ville de Pointe-Noire.

II. Architecture Source du Projet

L'application respecte une séparation stricte des langages et une 
modularité totale :

PointeResto/
            Config/             # Connexion BDD Pure (PHP)
            Backend/            # API REST (Architecture MVC en PHP Pur)
            Models/             # Modèles d'accès aux tables PostgreSQL
            Controllers/        # Contrôleurs logiques (Avis, Établissements, Médias)
            Public/Index.php    # Routeur et point d'entrée unique de l'API
            Frontend/           # Interface Client Mobile-First (HTML Pur)
            Assets/
            CSS/        # Feuilles de styles CSS Pur 
            JS/         # Scripts logiques Vanilla JS
            Index.html      # Portail de recherche citoyen
            Dashboard.html  # Espace de gestion restaurateur

Mesures de Sécurité Implémentées

1. Isolation Étanche des Langages : Aucune balise <style>, aucun attribut
inline style="" et aucune injection de propriétés CSS via JavaScript pour
garantir l'intégrité du code.

2. Vérification Strict des Médias (MediaController) : Blocage de l'upload
de faux menus (scripts malveillants masqués). Utilisation de la fonction
native mime_content_type() côté serveur pour analyser le fichier binaire
réel (seuls application/pdf, image/png et image/jpeg sont acceptés).

3. Lutte contre le Spam d'Avis : Collecte automatique de l'adresse IP de
l'appareil émetteur ($_SERVER['REMOTE_ADDR']) enregistrée de manière
immuable dans la table avis pour permettre le bannissement ou le
bridage des requêtes (Rate Limiting).

4. Requêtes Préparées PDO : Protection totale contre les injections SQL sur
l'ensemble des modules backend.

-- SCRIPT DE MIGRATION - POINTERESTO
DROP TABLE IF EXISTS medias CASCADE;
DROP TABLE IF EXISTS avis CASCADE;
DROP TABLE IF EXISTS menus CASCADE;
DROP TABLE IF EXISTS restaurants CASCADE;
DROP TABLE IF EXISTS workspaces CASCADE;
DROP TABLE IF EXISTS utilisateurs CASCADE;

-- Création des tables d'après le MPD StarUML
CREATE TABLE utilisateurs (
    id_utilisateurs SERIAL PRIMARY KEY,
    nom VARCHAR(60) NOT NULL,
    prenom VARCHAR(60) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    telephone VARCHAR(20),
    photo_profil VARCHAR(255),
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    derniere_connexion TIMESTAMP,
    statut_compte VARCHAR(20),
    role VARCHAR(20) NOT NULL,
    numero_piece VARCHAR(50),
    type_piece VARCHAR(50),
    nom_entreprise VARCHAR(50),
    adresse_entreprise TEXT,
    date_validation TIMESTAMP,
    matricule VARCHAR(50),
    niveau_acces VARCHAR(50)
);

CREATE TABLE workspaces (
    id_workspace SERIAL PRIMARY KEY,
    nom_quartier VARCHAR(100) NOT NULL,
    description TEXT,
    population_estimee INTEGER
);

CREATE TABLE restaurants (
    id_restaurant SERIAL PRIMARY KEY,
    workspace_id INTEGER REFERENCES workspaces(id_workspace) ON DELETE SET NULL,
    proprietaire_id INTEGER REFERENCES utilisateurs(id_utilisateurs) ON DELETE CASCADE,
    nom VARCHAR(100) NOT NULL,
    adresse TEXT NOT NULL,
    telephone VARCHAR(20),
    email VARCHAR(100),
    description TEXT,
    latitude NUMERIC(10, 8),
    longitude NUMERIC(10, 8),
    statut_ouverture VARCHAR(20),
    type_restaurant VARCHAR(50),
    gamme_prix VARCHAR(20),
    note_moyenne NUMERIC(2, 1),
    date_ajout TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    est_valide BOOLEAN DEFAULT FALSE
);

CREATE TABLE menus (
    id_menu SERIAL PRIMARY KEY,
    restaurant_id INTEGER REFERENCES restaurants(id_restaurant) ON DELETE CASCADE,
    titre VARCHAR(150) NOT NULL,
    description TEXT,
    prix INTEGER NOT NULL,
    disponible BOOLEAN DEFAULT TRUE,
    categorie VARCHAR(50)
);

CREATE TABLE avis (
    id_avis SERIAL PRIMARY KEY,
    restaurant_id INTEGER REFERENCES restaurants(id_restaurant) ON DELETE CASCADE,
    utilisateur_id INTEGER REFERENCES utilisateurs(id_utilisateurs) ON DELETE CASCADE,
    note INTEGER CHECK (note >= 1 AND note <= 5),
    commentaire TEXT,
    date_publication TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    est_anonyme BOOLEAN DEFAULT FALSE,
    statut_moderation VARCHAR(20) DEFAULT 'en_attente',
    adresse_ip VARCHAR(45)
);

CREATE TABLE medias (
    id_media SERIAL PRIMARY KEY,
    restaurant_id INTEGER REFERENCES restaurants(id_restaurant) ON DELETE CASCADE,
    nom_fichier VARCHAR(255) NOT NULL,
    type_mime VARCHAR(50),
    taille NUMERIC(8, 2),
    date_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    chemin_fichier VARCHAR(255) NOT NULL
);

-- Données de test (Seed)
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role, statut_compte) VALUES
('Moussa', 'Jean', 'jean.moussa@email.com', 'pass123', 'restaurateur', 'actif'),
('Tati', 'Grâce', 'grace.tati@email.com', 'pass456', 'client', 'actif');

INSERT INTO workspaces (nom_quartier, description, population_estimee) VALUES
('Grand Marché', 'Zone commerciale dynamique au centre-ville', 15000),
('Cité de la Joie', 'Secteur animé avec forte affluence étudiante', 12000);

INSERT INTO restaurants (workspace_id, proprietaire_id, nom, adresse, telephone, email, description, type_restaurant, gamme_prix, note_moyenne, est_valide) VALUES
(1, 1, 'La Marmite Africaine', 'Avenue de l''Indépendance, Face Grand Marché', '+242061112233', 'marmite@email.com', 'Spécialités locales et grillades savoureuses.', 'Traditionnel', 'Moyen', 4.5, TRUE);
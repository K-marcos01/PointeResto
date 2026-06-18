DROP TABLE IF EXISTS medias CASCADE;
DROP TABLE IF EXISTS avis CASCADE;
DROP TABLE IF EXISTS menus CASCADE;
DROP TABLE IF EXISTS restaurants CASCADE;
DROP TABLE IF EXISTS workspaces CASCADE;
DROP TABLE IF EXISTS utilisateurs CASCADE;

-- TABLE : utilisateurs
-- Gère les comptes clients, restaurateurs et modérateurs
CREATE TABLE utilisateurs (
    id_utilisateur    SERIAL PRIMARY KEY,
    nom               VARCHAR(60)  NOT NULL,
    prenom            VARCHAR(60)  NOT NULL,
    email             VARCHAR(150) UNIQUE NOT NULL,
    mot_de_passe      VARCHAR(255) NOT NULL,          
    telephone         VARCHAR(20),
    photo_profil      VARCHAR(255),
    date_creation     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    derniere_connexion TIMESTAMP,
    statut_compte     VARCHAR(20)  DEFAULT 'actif',
    role              VARCHAR(20)  NOT NULL CHECK (role IN ('client','restaurateur','moderateur')),
    -- Champs spécifiques aux restaurateurs
    numero_piece      VARCHAR(50),
    type_piece        VARCHAR(50),
    nom_entreprise    VARCHAR(50),
    adresse_entreprise TEXT,
    date_validation   TIMESTAMP,
    matricule         VARCHAR(50),
    niveau_acces      VARCHAR(50)
);

-- TABLE : workspaces
-- Découpage géographique de Pointe-Noire par quartier
CREATE TABLE workspaces (
    id_workspace      SERIAL PRIMARY KEY,
    nom_quartier      VARCHAR(100) NOT NULL,
    description       TEXT,
    population_estimee INTEGER
);

-- TABLE : restaurants
-- Établissements référencés sur la plateforme
CREATE TABLE restaurants (
    id_restaurant     SERIAL PRIMARY KEY,
    workspace_id      INTEGER REFERENCES workspaces(id_workspace) ON DELETE SET NULL,
    proprietaire_id   INTEGER REFERENCES utilisateurs(id_utilisateur) ON DELETE CASCADE,
    nom               VARCHAR(100) NOT NULL,
    adresse           TEXT NOT NULL,
    telephone         VARCHAR(20),
    email             VARCHAR(100),
    description       TEXT,
    latitude          NUMERIC(10,8),
    longitude         NUMERIC(10,8),
    statut_ouverture  VARCHAR(20) DEFAULT 'Fermé' CHECK (statut_ouverture IN ('Ouvert','Ferme bientot','Fermé')),
    type_restaurant   VARCHAR(50),
    gamme_prix        VARCHAR(20) CHECK (gamme_prix IN ('Économique','Classique','Gastronomique')),
    note_moyenne      NUMERIC(2,1) DEFAULT 0.0,
    date_ajout        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    est_valide        BOOLEAN DEFAULT FALSE
);

-- TABLE : menus
-- Plats et formules rattachés aux restaurants
CREATE TABLE menus (
    id_menu           SERIAL PRIMARY KEY,
    restaurant_id     INTEGER REFERENCES restaurants(id_restaurant) ON DELETE CASCADE,
    titre             VARCHAR(150) NOT NULL,
    description       TEXT,
    prix              INTEGER NOT NULL CHECK (prix >= 0),
    disponible        BOOLEAN DEFAULT TRUE,
    categorie         VARCHAR(50)
);

-- TABLE : avis
-- Notes et commentaires avec sécurité anti-spam intégrée
CREATE TABLE avis (
    id_avis           SERIAL PRIMARY KEY,
    restaurant_id     INTEGER REFERENCES restaurants(id_restaurant) ON DELETE CASCADE,
    utilisateur_id    INTEGER REFERENCES utilisateurs(id_utilisateur) ON DELETE CASCADE,
    note              INTEGER CHECK (note >= 1 AND note <= 5),
    commentaire       TEXT,
    date_publication  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    est_anonyme       BOOLEAN DEFAULT FALSE,
    statut_moderation VARCHAR(20) DEFAULT 'en_attente' CHECK (statut_moderation IN ('en_attente','approuve','rejete')),
    adresse_ip        VARCHAR(45)    -- Stockée pour la lutte anti-spam par IP
);

-- TABLE : medias
-- Photos et fichiers téléversés de manière sécurisée
CREATE TABLE medias (
    id_media          SERIAL PRIMARY KEY,
    restaurant_id     INTEGER REFERENCES restaurants(id_restaurant) ON DELETE CASCADE,
    nom_fichier       VARCHAR(255) NOT NULL,
    type_mime         VARCHAR(50) CHECK (type_mime IN ('image/jpeg','image/png')), -- JPEG/PNG uniquement (sécurité MOA)
    taille            NUMERIC(8,2),
    date_upload       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    chemin_fichier    VARCHAR(255) NOT NULL
);

-- INDEX pour optimiser les recherches fréquentes
CREATE INDEX idx_restaurants_workspace ON restaurants(workspace_id);
CREATE INDEX idx_restaurants_valide ON restaurants(est_valide);
CREATE INDEX idx_menus_restaurant ON menus(restaurant_id);
CREATE INDEX idx_avis_restaurant ON avis(restaurant_id);
CREATE INDEX idx_avis_statut ON avis(statut_moderation);

-- DONNÉES DE TEST (SEED) - Minimum 15 établissements (exigence MOA)
-- Données réalistes de Pointe-Noire, Congo

-- Utilisateurs
-- Ces hash correspondent au mot de passe 'PointeResto2026'
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role, statut_compte, telephone) VALUES
('Ngoma',   'Patrick',    'patrick.ngoma@gmail.com',    '$2y$12$exampleHashRestaurateur1xxxxxxxxxxxxxxxxxxxx', 'restaurateur', 'actif', '+242066001001'),
('Boukoula', 'Régine',   'regine.boukoula@gmail.com',   '$2y$12$exampleHashRestaurateur2xxxxxxxxxxxxxxxxxxxx', 'restaurateur', 'actif', '+242066002002'),
('Moukala', 'Franck',    'franck.moukala@gmail.com',    '$2y$12$exampleHashRestaurateur3xxxxxxxxxxxxxxxxxxxx', 'restaurateur', 'actif', '+242066003003'),
('Nzaba',   'Pierre',    'pierre.nzaba@pointeresto.cg', '$2y$12$exampleHashModerateur1xxxxxxxxxxxxxxxxxxxxx',  'moderateur',   'actif', '+242066004004'),
('Taty',    'Grâce',     'grace.taty@gmail.com',        '$2y$12$exampleHashClient1xxxxxxxxxxxxxxxxxxxxxxxxx',  'client',       'actif', '+242066005005'),
('Loemba',  'Théophile', 'theo.loemba@gmail.com',       '$2y$12$exampleHashClient2xxxxxxxxxxxxxxxxxxxxxxxxx',  'client',       'actif', '+242066006006');

-- Workspaces / Quartiers de Pointe-Noire
INSERT INTO workspaces (nom_quartier, description, population_estimee) VALUES
('Centre-Ville / Lumumba',  'Artère principale et cœur commercial de Pointe-Noire',          45000),
('Côte Sauvage',            'Front de mer, restaurants de poisson et d''ambiance balnéaire',  18000),
('Tié-Tié',                 'Quartier populaire et animé, fort de la cuisine locale',          32000),
('Mpaka',                   'Zone résidentielle calme avec quelques maquis discrets',           9000),
('Fond Tié-Tié',            'Secteur en développement, fast-foods et snacks étudiants',        14000),
('Grand Bois',              'Quartier résidentiel Nord, restaurants familiaux',                11000);

-- Restaurants (20 établissements réalistes)
INSERT INTO restaurants (workspace_id, proprietaire_id, nom, adresse, telephone, email, description, latitude, longitude, statut_ouverture, type_restaurant, gamme_prix, note_moyenne, est_valide) VALUES
(1, 1, 'La Paillote',         'Bd Dr Jacques Bouiti, Centre-Ville',            '+242066100100', 'lapaillote@gmail.com',      'Institution incontournable de Pointe-Noire, spécialités de grillades et ambiance chaleureuse.',   -4.7760, 11.8637, 'Ouvert',       'Traditionnel',  'Classique',     4.6, TRUE),
(1, 2, 'Le Comptoir',         'Av. Charles de Gaulle, Centre-Ville',           '+242066100200', 'lecomptoir@gmail.com',      'Restaurant franco-congolais élégant, carte variée et cocktails.',                                 -4.7745, 11.8610, 'Ouvert',       'Franco-Congolais','Gastronomique', 4.4, TRUE),
(1, 3, 'Caicos Restaurant',   'Rue Félix Éboué, Près de l''Hôtel Atlantic',    '+242066100300', 'caicos@gmail.com',          'Cuisine internationale avec vue sur jardin, idéal pour réunions d''affaires.',                     -4.7790, 11.8655, 'Ferme bientot','International', 'Gastronomique', 4.3, TRUE),
(2, 1, 'Le Derrick',          'Av. Massafi, Côte Sauvage',                     '+242066200100', 'lederrick@gmail.com',       'Face à la mer, spécialités de fruits de mer frais : capitaine braisé, crevettes géantes.',        -4.7920, 11.8580, 'Ouvert',       'Fruits de Mer',  'Classique',     4.7, TRUE),
(2, 2, 'Chez Maman Joséphine','Plage de la Côte Sauvage, Secteur 3',           '+242066200200', 'mamanjosephine@gmail.com',  'Maquis populaire les pieds dans le sable, ambiance locale authentique.',                          -4.7950, 11.8560, 'Ouvert',       'Maquis',         'Économique',    4.5, TRUE),
(2, 3, 'Le Pescadou',         'Promenade de la Côte Sauvage',                  '+242066200300', 'lepescadou@gmail.com',      'Restaurant de poissons et fruits de mer, vue panoramique sur l''Atlantique.',                      -4.7900, 11.8570, 'Ouvert',       'Fruits de Mer',  'Gastronomique', 4.2, TRUE),
(3, 1, 'Maquis Chez Tantie',  'Rue du Marché, Tié-Tié',                        '+242066300100', 'cheztantie@gmail.com',      'Cuisine congolaise maison, saka-saka, poisson salé, pondu. Fait maison chaque jour.',             -4.7825, 11.8710, 'Ouvert',       'Maquis',         'Économique',    4.8, TRUE),
(3, 2, 'Braiserie du Peuple', 'Av. de l''Indépendance, Tié-Tié',               '+242066300200', 'braiserie@gmail.com',       'Spécialiste du poulet braisé, brochettes et alloco. Le soir et les week-ends uniquement.',         -4.7840, 11.8720, 'Ferme bientot','Grillade',       'Économique',    4.6, TRUE),
(3, 3, 'Fast Food du Rond-Point','Rond-Point Lumumba, Tié-Tié',                '+242066300300', 'ffronpoint@gmail.com',      'Burgers, chawarmas, frites et boissons fraîches. Service rapide.',                                -4.7800, 11.8700, 'Ouvert',       'Fast-food',      'Économique',    4.0, TRUE),
(3, 1, 'La Marmite Africaine', 'Bd Bakongo, Tié-Tié',                          '+242066300400', 'lamarmite@gmail.com',       'Restaurant populaire, repas du jour copieux et savoureux, prix abordables.',                       -4.7855, 11.8730, 'Ouvert',       'Traditionnel',   'Économique',    4.3, TRUE),
(4, 2, 'Villa Savane',        'Cité des 40 Logements, Mpaka',                  '+242066400100', 'villasavane@gmail.com',     'Cadre verdoyant, cuisine fusion africaine et européenne dans un jardin privatif.',                  -4.8010, 11.8800, 'Ouvert',       'Fusion',         'Gastronomique', 4.5, TRUE),
(4, 3, 'Le Calme Bleu',       'Rue des Cocotiers, Mpaka',                      '+242066400200', 'lecalmebleu@gmail.com',     'Maquis familial au calme, spécialité de mafé et de poulet yassa.',                                -4.8025, 11.8820, 'Fermé',        'Maquis',         'Économique',    4.1, TRUE),
(5, 1, 'Snack Étudiants',     'Av. de l''Université, Fond Tié-Tié',            '+242066500100', 'snacketud@gmail.com',       'Sandwichs, œufs durs, beignets et jus frais. Ouvert tôt pour les cours du matin.',                  -4.7880, 11.8765, 'Ouvert',       'Fast-food',      'Économique',    3.9, TRUE),
(5, 2, 'Pizza Kongossa',      'Centre Commercial Fond Tié-Tié',                '+242066500200', 'pizzakongossa@gmail.com',   'Première pizzeria artisanale de Pointe-Noire, pâte fine, ingrédients locaux.',                     -4.7870, 11.8755, 'Ouvert',       'Pizzeria',       'Classique',     4.4, TRUE),
(5, 3, 'Chawarma King',       'Rue des Écoles, Fond Tié-Tié',                  '+242066500300', 'chawarmaking@gmail.com',    'Spécialiste du chawarma, falafels et sandwichs orientaux à emporter.',                            -4.7865, 11.8760, 'Ouvert',       'Fast-food',      'Économique',    4.2, TRUE),
(6, 1, 'Le Forestier',        'Route de Grand Bois, Km 3',                     '+242066600100', 'leforestier@gmail.com',     'Restaurant en pleine nature, gibier, champignons et spécialités forestières du Congo.',             -4.8100, 11.8900, 'Ouvert',       'Traditionnel',   'Classique',     4.6, TRUE),
(6, 2, 'Boulangerie-Snack Mimosa','Av. Principale, Grand Bois',                '+242066600200', 'mimosa@gmail.com',          'Boulangerie artisanale et snack, viennoiseries maison et sandwichs frais dès 6h.',                  -4.8085, 11.8890, 'Ouvert',       'Boulangerie',    'Économique',    4.5, TRUE),
(1, 2, 'Le Sénégalais',       'Av. Félix Tchicaya, Centre-Ville',              '+242066100400', 'lesenegalais@gmail.com',    'Authentique cuisine sénégalaise : thiéboudienne, yassa poulet, mafé bœuf.',                        -4.7755, 11.8620, 'Ouvert',       'Africain',       'Classique',     4.3, TRUE),
(2, 3, 'Bar-Plage Atlantique', 'Plage de la Côte Sauvage, face à l''hôtel',    '+242066200400', 'barplage@gmail.com',        'Cocktails tropicaux, tapas et en-cas, ambiance musicale le soir.',                                -4.7940, 11.8555, 'Ferme bientot','Bar-Restaurant',  'Classique',     4.0, TRUE),
(3, 1, 'Chez Fifi Grillades', 'Marché de Tié-Tié, Entrée Nord',               '+242066300500', 'chezfifi@gmail.com',        'Grillades de porc, bœuf et mouton à la braise. Renommée pour ses sauces pimentées.',               -4.7810, 11.8715, 'Ouvert',       'Grillade',       'Économique',    4.7, TRUE);

-- Menus représentatifs
INSERT INTO menus (restaurant_id, titre, description, prix, disponible, categorie) VALUES
-- La Paillote
(1, 'Poulet Braisé Royal',     'Poulet entier braisé aux épices locales, servi avec alloco et salade',           6500, TRUE, 'Plat'),
(1, 'Capitaine Grillé',        'Filet de capitaine grillé sur charbon, riz blanc et légumes de saison',          8000, TRUE, 'Plat'),
(1, 'Saka-Saka Traditionnel',  'Feuilles de manioc pilées au poisson salé, banane plantain et piment',           3500, TRUE, 'Plat'),
-- Le Derrick
(4, 'Plateau Fruits de Mer',   'Crevettes géantes, calamars et palourdes au beurre citronné, frites maison',    12000, TRUE, 'Plat'),
(4, 'Bar Rayé Sauce Mafé',     'Bar rayé entier en sauce mafé à l''arachide, riz parfumé',                       9500, TRUE, 'Plat'),
-- Maquis Chez Tantie
(7, 'Plat du Jour',            'Plat unique quotidien selon arrivage : pondu, mosaka ou ntaba',                   2000, TRUE, 'Formule'),
(7, 'Saka-Saka Maison',        'Feuilles de manioc pilées maison, poisson fumé, huile de palme rouge',           1500, TRUE, 'Plat'),
-- Fast Food Rond-Point
(9, 'Menu Burger Classique',   'Double burger steak + fromage, frites maison, boisson fraîche',                  3000, TRUE, 'Formule'),
(9, 'Chawarma Poulet',         'Chawarma poulet mariné, salade, sauce blanche, pain pita chaud',                 2500, TRUE, 'Snack'),
-- Pizza Kongossa
(14,'Pizza Congolaise',        'Tomates, fromage, crevettes locales, piment doux et coriandre fraîche',          5500, TRUE, 'Plat'),
(14,'Pizza 4 Saisons',         'Jambon, champignons, artichauts, olives, sauce tomate maison',                   5000, TRUE, 'Plat'),
-- Le Forestier
(16,'Gibier du Jour',          'Viande de brousse en sauce, igname pilée et légumes forestiers',                  9000, TRUE, 'Plat'),
(16,'Champignons Sauvages',    'Poêlée de champignons forestiers à l''ail et au persil, pain de manioc',          4500, TRUE, 'Entrée');

-- Avis initiaux (statut approuvé)
INSERT INTO avis (restaurant_id, utilisateur_id, note, commentaire, est_anonyme, statut_moderation, adresse_ip) VALUES
(1, 5, 5, 'La Paillote reste une valeur sûre de Pointe-Noire. Le poulet braisé est impeccable.', FALSE, 'approuve', '197.243.1.1'),
(1, 6, 4, 'Bonne cuisine, ambiance conviviale. Un peu cher mais ça vaut le déplacement.', FALSE, 'approuve', '197.243.1.2'),
(4, 5, 5, 'Le meilleur plateau de fruits de mer de la Côte Sauvage. Fraîcheur garantie.', FALSE, 'approuve', '197.243.1.3'),
(7, 6, 5, 'Chez Tantie, on mange comme à la maison. Le saka-saka est incomparable.', FALSE, 'approuve', '197.243.1.4'),
(9, 5, 4, 'Rapide et bon, idéal après les cours. Le burger classique est généreux.', TRUE,  'approuve', '197.243.1.5'),
(14,6, 4, 'Pizza originale avec des saveurs locales inattendues. Belle surprise.', FALSE, 'approuve', '197.243.1.6');

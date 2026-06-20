--  Script de mise à jour — ajoute image_url + complète les menus
-- À exécuter sur la base Railway existante (ne touche pas aux tables déjà en place : avis, restaurants, utilisateurs...)

-- 1) Ajouter la colonne image_url si elle n'existe pas encore
ALTER TABLE menus ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);

-- 2) Mettre à jour les plats existants avec des images réalistes
UPDATE menus SET image_url = 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=300&q=80' WHERE titre = 'Poulet Braisé Royal';
UPDATE menus SET image_url = 'https://images.unsplash.com/photo-1535400255456-067e2bc1c0e2?w=300&q=80' WHERE titre = 'Capitaine Grillé';
UPDATE menus SET image_url = 'https://images.unsplash.com/photo-1604908554007-31be7e0d3c0a?w=300&q=80' WHERE titre = 'Saka-Saka Traditionnel';
UPDATE menus SET image_url = 'https://images.unsplash.com/photo-1638176066666-ffb2f013c7dd?w=300&q=80' WHERE titre = 'Jus de Bissap';
UPDATE menus SET image_url = 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=300&q=80' WHERE titre = 'Plateau Fruits de Mer';
UPDATE menus SET image_url = 'https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=300&q=80' WHERE titre = 'Bar Rayé Sauce Mafé';
UPDATE menus SET image_url = 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=300&q=80' WHERE titre = 'Capitaine Braisé';
UPDATE menus SET image_url = 'https://images.unsplash.com/photo-1547592180-85f173990554?w=300&q=80' WHERE titre = 'Plat du Jour';
UPDATE menus SET image_url = 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=300&q=80' WHERE titre = 'Saka-Saka Maison';
UPDATE menus SET image_url = 'https://images.unsplash.com/photo-1560023907-5f339617ea30?w=300&q=80' WHERE titre = 'Eau Minérale';
UPDATE menus SET image_url = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&q=80' WHERE titre = 'Menu Burger Classique';
UPDATE menus SET image_url = 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=300&q=80' WHERE titre = 'Chawarma Poulet';
UPDATE menus SET image_url = 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=300&q=80' WHERE titre = 'Frites Maison';
UPDATE menus SET image_url = 'https://images.unsplash.com/photo-1593504049359-74330189a345?w=300&q=80' WHERE titre = 'Pizza Congolaise';
UPDATE menus SET image_url = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&q=80' WHERE titre = 'Pizza 4 Saisons';
UPDATE menus SET image_url = 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=300&q=80' WHERE titre = 'Pizza Margherita';
UPDATE menus SET image_url = 'https://images.unsplash.com/photo-1432139509613-5c4255815697?w=300&q=80' WHERE titre = 'Gibier du Jour';
UPDATE menus SET image_url = 'https://images.unsplash.com/photo-1504545102780-26774c1bb073?w=300&q=80' WHERE titre = 'Champignons Sauvages';
UPDATE menus SET image_url = 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=300&q=80' WHERE titre = 'Likoké Grillé';

-- 3) Compléter chaque restaurant pour atteindre minimum 5 plats
--    (seuls les restaurants avec moins de 5 plats actuellement sont concernés)

-- Restaurant 1 : La Paillote (avait 4 plats) → +1
INSERT INTO menus (restaurant_id, titre, description, prix, disponible, categorie, image_url)
SELECT 1, 'Brochettes de Bœuf', 'Brochettes marinées aux épices, grillées au charbon de bois', 4000, TRUE, 'Entrée',
       'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=300&q=80'
WHERE (SELECT COUNT(*) FROM menus WHERE restaurant_id = 1) < 5;

-- Restaurant 2 : Le Comptoir (0 plat actuellement) → +5
INSERT INTO menus (restaurant_id, titre, description, prix, disponible, categorie, image_url) VALUES
(2, 'Tartare de Thon', 'Thon frais mariné, avocat, sauce soja-gingembre', 5500, TRUE, 'Entrée', 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=300&q=80'),
(2, 'Magret de Canard', 'Magret de canard sauce miel-poivre, gratin dauphinois', 9500, TRUE, 'Plat', 'https://images.unsplash.com/photo-1432139555190-58524dae6a55?w=300&q=80'),
(2, 'Filet de Bœuf Sauce Poivre', 'Filet de bœuf grillé, sauce au poivre vert, frites maison', 11000, TRUE, 'Plat', 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&q=80'),
(2, 'Crème Brûlée', 'Crème brûlée vanille bourbon, croûte caramélisée', 3000, TRUE, 'Dessert', 'https://images.unsplash.com/photo-1470124182917-cc6e71b22ecc?w=300&q=80'),
(2, 'Cocktail Maison', 'Rhum, jus de fruits locaux, citron vert et menthe fraîche', 3500, TRUE, 'Boisson', 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=300&q=80');

-- Restaurant 3 : Caicos Restaurant (0 plat) → +5
INSERT INTO menus (restaurant_id, titre, description, prix, disponible, categorie, image_url) VALUES
(3, 'Salade César au Poulet', 'Salade romaine, poulet grillé, parmesan, croûtons maison', 4500, TRUE, 'Entrée', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80'),
(3, 'Pavé de Saumon Grillé', 'Saumon grillé, riz pilaf, légumes croquants', 9000, TRUE, 'Plat', 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=300&q=80'),
(3, 'Risotto aux Champignons', 'Risotto crémeux, champignons de Paris, parmesan râpé', 6500, TRUE, 'Plat', 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=300&q=80'),
(3, 'Tiramisu Maison', 'Tiramisu classique au café et mascarpone', 3200, TRUE, 'Dessert', 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=300&q=80'),
(3, 'Jus de Fruits Frais', 'Jus pressé du jour : ananas, mangue ou orange', 1500, TRUE, 'Boisson', 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=300&q=80');

-- Restaurant 4 : Le Derrick (avait 3 plats) → +2
INSERT INTO menus (restaurant_id, titre, description, prix, disponible, categorie, image_url) VALUES
(4, 'Brochettes de Crevettes', 'Crevettes grillées marinées au citron et paprika', 6000, TRUE, 'Entrée', 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=300&q=80'),
(4, 'Jus de Gingembre', 'Jus de gingembre frais, légèrement pimenté et sucré', 800, TRUE, 'Boisson', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&q=80');

-- Restaurants 5, 6 : Chez Maman Joséphine, Le Pescadou (0 plat chacun) → +5 chacun
INSERT INTO menus (restaurant_id, titre, description, prix, disponible, categorie, image_url) VALUES
(5, 'Poisson Salé Sauce Gombo', 'Poisson salé traditionnel en sauce gombo, riz blanc', 3000, TRUE, 'Plat', 'https://images.unsplash.com/photo-1626500136667-aa86eb3fdd55?w=300&q=80'),
(5, 'Alloco Maison', 'Banane plantain frite, sauce pimentée maison', 1500, TRUE, 'Accompagnement', 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=300&q=80'),
(5, 'Poulet Yassa', 'Poulet mariné au citron et oignons confits', 4000, TRUE, 'Plat', 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=300&q=80'),
(5, 'Bissap Glacé', 'Hibiscus infusé, servi bien frais', 500, TRUE, 'Boisson', 'https://images.unsplash.com/photo-1638176066666-ffb2f013c7dd?w=300&q=80'),
(5, 'Beignets Sucrés', 'Beignets traditionnels moelleux, sucre vanillé', 1000, TRUE, 'Dessert', 'https://images.unsplash.com/photo-1551106652-a5bcf4b29ab6?w=300&q=80'),
(6, 'Soupe de Poisson', 'Soupe de poisson épicée, base de tomate et piment', 3500, TRUE, 'Entrée', 'https://images.unsplash.com/photo-1547592180-85f173990554?w=300&q=80'),
(6, 'Bar Grillé Citron', 'Bar entier grillé, citron confit, riz parfumé', 8500, TRUE, 'Plat', 'https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=300&q=80'),
(6, 'Calamars Frits', 'Calamars frits croustillants, sauce tartare maison', 5500, TRUE, 'Entrée', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=300&q=80'),
(6, 'Salade de Mangue Verte', 'Mangue verte râpée, cacahuètes, vinaigrette pimentée', 2500, TRUE, 'Entrée', 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&q=80'),
(6, 'Jus d''Ananas Frais', 'Ananas pressé du jour, sans sucre ajouté', 1200, TRUE, 'Boisson', 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=300&q=80');

-- Restaurant 7 : Maquis Chez Tantie (avait 3 plats) → +2
INSERT INTO menus (restaurant_id, titre, description, prix, disponible, categorie, image_url) VALUES
(7, 'Poulet Moambé', 'Poulet en sauce moambé traditionnelle, riz blanc', 3500, TRUE, 'Plat', 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=300&q=80'),
(7, 'Bissap Maison', 'Boisson rafraîchissante à l''hibiscus, recette de la maison', 500, TRUE, 'Boisson', 'https://images.unsplash.com/photo-1638176066666-ffb2f013c7dd?w=300&q=80');

-- Restaurant 8 : Braiserie du Peuple (0 plat) → +5
INSERT INTO menus (restaurant_id, titre, description, prix, disponible, categorie, image_url) VALUES
(8, 'Poulet Braisé Entier', 'Poulet entier braisé au charbon, épices maison', 5000, TRUE, 'Plat', 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=300&q=80'),
(8, 'Brochettes Mixtes', 'Assortiment bœuf, poulet et mouton grillés', 4500, TRUE, 'Plat', 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=300&q=80'),
(8, 'Alloco Épicé', 'Banane plantain frite, piment frais', 1500, TRUE, 'Accompagnement', 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=300&q=80'),
(8, 'Sauce Piment Maison', 'Condiment pimenté traditionnel servi en accompagnement', 500, TRUE, 'Accompagnement', 'https://images.unsplash.com/photo-1583224964978-2257b960c3d3?w=300&q=80'),
(8, 'Bière Locale', 'Bière congolaise bien fraîche, 65cl', 1500, TRUE, 'Boisson', 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=300&q=80');

-- Restaurant 9 : Fast Food Rond-Point (avait 3 plats) → +2
INSERT INTO menus (restaurant_id, titre, description, prix, disponible, categorie, image_url) VALUES
(9, 'Hot-Dog Maison', 'Saucisse grillée, pain frais, sauce moutarde et ketchup', 1800, TRUE, 'Snack', 'https://images.unsplash.com/photo-1612392062798-2dd444b439b7?w=300&q=80'),
(9, 'Milk-Shake Vanille', 'Milk-shake onctueux à la vanille', 2000, TRUE, 'Boisson', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&q=80');

-- Restaurant 10 : La Marmite Africaine (0 plat) → +5
INSERT INTO menus (restaurant_id, titre, description, prix, disponible, categorie, image_url) VALUES
(10, 'Plat du Jour Marmite', 'Sélection quotidienne : poisson, viande ou légumes selon arrivage', 2500, TRUE, 'Formule', 'https://images.unsplash.com/photo-1547592180-85f173990554?w=300&q=80'),
(10, 'Riz Sauce Arachide', 'Riz blanc, sauce arachide traditionnelle, viande de bœuf', 3000, TRUE, 'Plat', 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=300&q=80'),
(10, 'Pondu Viande Fumée', 'Feuilles de manioc, viande fumée, huile de palme', 3200, TRUE, 'Plat', 'https://images.unsplash.com/photo-1604908554007-31be7e0d3c0a?w=300&q=80'),
(10, 'Beignets Haricots', 'Beignets de haricots traditionnels, croustillants', 800, TRUE, 'Entrée', 'https://images.unsplash.com/photo-1551106652-a5bcf4b29ab6?w=300&q=80'),
(10, 'Jus de Tamarin', 'Jus de tamarin frais, légèrement acidulé et sucré', 700, TRUE, 'Boisson', 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=300&q=80');

-- Restaurant 11 : Villa Savane (0 plat) → +5
INSERT INTO menus (restaurant_id, titre, description, prix, disponible, categorie, image_url) VALUES
(11, 'Carpaccio de Bœuf', 'Fines tranches de bœuf, copeaux de parmesan, roquette', 6000, TRUE, 'Entrée', 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=300&q=80'),
(11, 'Poisson Braisé Fusion', 'Poisson braisé, sauce mangue-gingembre, légumes croquants', 8500, TRUE, 'Plat', 'https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=300&q=80'),
(11, 'Poulet Tikka Africain', 'Poulet mariné aux épices locales et indiennes, riz parfumé', 7500, TRUE, 'Plat', 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=300&q=80'),
(11, 'Mousse au Chocolat', 'Mousse au chocolat noir, éclats de cacao torréfié', 3000, TRUE, 'Dessert', 'https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?w=300&q=80'),
(11, 'Cocktail Tropical', 'Mélange de fruits tropicaux frais et rhum local', 3800, TRUE, 'Boisson', 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=300&q=80');

-- Restaurant 12 : Le Calme Bleu (0 plat) → +5
INSERT INTO menus (restaurant_id, titre, description, prix, disponible, categorie, image_url) VALUES
(12, 'Mafé de Bœuf', 'Bœuf mijoté en sauce arachide, riz blanc', 3500, TRUE, 'Plat', 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=300&q=80'),
(12, 'Poulet Yassa Maison', 'Poulet mariné citron-oignons, recette familiale', 3800, TRUE, 'Plat', 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=300&q=80'),
(12, 'Salade Composée', 'Tomates, concombres, oignons, vinaigrette maison', 1500, TRUE, 'Entrée', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80'),
(12, 'Banane Plantain Sucrée', 'Banane plantain caramélisée, dessert traditionnel', 1200, TRUE, 'Dessert', 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=300&q=80'),
(12, 'Eau Minérale Fraîche', 'Bouteille d''eau minérale 50cl', 300, TRUE, 'Boisson', 'https://images.unsplash.com/photo-1560023907-5f339617ea30?w=300&q=80');

-- Restaurant 13 : Snack Étudiants (0 plat) → +5
INSERT INTO menus (restaurant_id, titre, description, prix, disponible, categorie, image_url) VALUES
(13, 'Sandwich Œuf', 'Pain frais, œufs durs, mayonnaise, légumes croquants', 1000, TRUE, 'Snack', 'https://images.unsplash.com/photo-1567234669003-dce7a7a88821?w=300&q=80'),
(13, 'Beignets du Matin', 'Beignets traditionnels chauds, parfaits pour le petit-déjeuner', 500, TRUE, 'Snack', 'https://images.unsplash.com/photo-1551106652-a5bcf4b29ab6?w=300&q=80'),
(13, 'Jus de Fruit Frais', 'Jus pressé du jour selon disponibilité', 800, TRUE, 'Boisson', 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=300&q=80'),
(13, 'Sandwich Thon', 'Pain frais, thon, salade, sauce maison', 1300, TRUE, 'Snack', 'https://images.unsplash.com/photo-1559054663-e8d23213f361?w=300&q=80'),
(13, 'Café Noir', 'Café local torréfié, servi chaud', 400, TRUE, 'Boisson', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=300&q=80');

-- Restaurant 14, 15 : Pizza Kongossa, Chawarma King (avait 3 plats chacun) → +2 chacun
INSERT INTO menus (restaurant_id, titre, description, prix, disponible, categorie, image_url) VALUES
(14, 'Pizza Reine', 'Jambon, champignons, mozzarella, sauce tomate maison', 5200, TRUE, 'Plat', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=300&q=80'),
(14, 'Tiramisu', 'Dessert italien classique au café et mascarpone', 3000, TRUE, 'Dessert', 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=300&q=80'),
(15, 'Falafels Maison', 'Boulettes de pois chiches frites, sauce tahini', 2000, TRUE, 'Snack', 'https://images.unsplash.com/photo-1593001874117-c99c800e3eb6?w=300&q=80'),
(15, 'Chawarma Bœuf', 'Chawarma bœuf mariné, pain pita, sauce blanche', 2800, TRUE, 'Snack', 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=300&q=80');

-- Restaurants 16, 17 : Le Forestier, Boulangerie Mimosa (avait 3 plats / 0 plat)
INSERT INTO menus (restaurant_id, titre, description, prix, disponible, categorie, image_url) VALUES
(16, 'Jus de Fruits Forestiers', 'Jus pressé de fruits sauvages locaux', 1000, TRUE, 'Boisson', 'https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=300&q=80'),
(16, 'Pintade Sauce Champignon', 'Pintade mijotée, sauce aux champignons forestiers', 8500, TRUE, 'Plat', 'https://images.unsplash.com/photo-1432139509613-5c4255815697?w=300&q=80'),
(17, 'Croissant Beurre', 'Croissant pur beurre, croustillant et doré', 700, TRUE, 'Snack', 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=300&q=80'),
(17, 'Sandwich Jambon-Fromage', 'Pain frais, jambon, fromage, beurre', 1500, TRUE, 'Snack', 'https://images.unsplash.com/photo-1567234669003-dce7a7a88821?w=300&q=80'),
(17, 'Pain au Chocolat', 'Viennoiserie feuilletée fourrée au chocolat', 700, TRUE, 'Snack', 'https://images.unsplash.com/photo-1623334044303-241021148842?w=300&q=80'),
(17, 'Baguette Tradition', 'Pain frais croustillant, cuit chaque matin', 300, TRUE, 'Boulangerie', 'https://images.unsplash.com/photo-1549931319-a545749fcd09?w=300&q=80'),
(17, 'Café au Lait', 'Café local et lait chaud mousseux', 600, TRUE, 'Boisson', 'https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=300&q=80');

-- Restaurant 18 : Le Sénégalais (0 plat) → +5
INSERT INTO menus (restaurant_id, titre, description, prix, disponible, categorie, image_url) VALUES
(18, 'Thiéboudienne', 'Riz au poisson, légumes mijotés, recette sénégalaise authentique', 4500, TRUE, 'Plat', 'https://images.unsplash.com/photo-1604908554007-31be7e0d3c0a?w=300&q=80'),
(18, 'Yassa Poulet', 'Poulet mariné citron-oignons confits, riz blanc', 4000, TRUE, 'Plat', 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=300&q=80'),
(18, 'Mafé Bœuf', 'Bœuf mijoté en sauce arachide onctueuse', 4200, TRUE, 'Plat', 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=300&q=80'),
(18, 'Accras de Poisson', 'Beignets de poisson épicés, sauce pimentée', 2000, TRUE, 'Entrée', 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=300&q=80'),
(18, 'Bissap Sénégalais', 'Jus d''hibiscus sucré à la menthe fraîche', 600, TRUE, 'Boisson', 'https://images.unsplash.com/photo-1638176066666-ffb2f013c7dd?w=300&q=80');

-- Restaurant 19 : Bar-Plage Atlantique (0 plat) → +5
INSERT INTO menus (restaurant_id, titre, description, prix, disponible, categorie, image_url) VALUES
(19, 'Tapas Mixtes', 'Assortiment de tapas : olives, fromages, charcuterie', 4500, TRUE, 'Entrée', 'https://images.unsplash.com/photo-1541529086526-db283c563270?w=300&q=80'),
(19, 'Brochettes Crevettes Plage', 'Crevettes grillées, citron vert et coriandre', 5500, TRUE, 'Plat', 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=300&q=80'),
(19, 'Cocktail Mojito', 'Rhum, menthe fraîche, citron vert, eau gazeuse', 3500, TRUE, 'Boisson', 'https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=300&q=80'),
(19, 'Piña Colada', 'Rhum, jus d''ananas, crème de coco', 3800, TRUE, 'Boisson', 'https://images.unsplash.com/photo-1546171753-97d7676e4602?w=300&q=80'),
(19, 'Nachos Fromage', 'Chips de maïs, fromage fondu, sauce piquante', 3000, TRUE, 'Snack', 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=300&q=80');

-- Restaurant 20 : Chez Fifi Grillades (0 plat) → +5
INSERT INTO menus (restaurant_id, titre, description, prix, disponible, categorie, image_url) VALUES
(20, 'Grillade de Porc', 'Porc grillé au charbon, sauce pimentée maison', 4000, TRUE, 'Plat', 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=300&q=80'),
(20, 'Grillade de Mouton', 'Côtelettes de mouton marinées, grillées sur braise', 4500, TRUE, 'Plat', 'https://images.unsplash.com/photo-1432139509613-5c4255815697?w=300&q=80'),
(20, 'Brochettes Bœuf Épicées', 'Brochettes de bœuf mariné aux épices locales', 3800, TRUE, 'Plat', 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=300&q=80'),
(20, 'Alloco Fifi', 'Banane plantain frite, sauce pimentée signature', 1500, TRUE, 'Accompagnement', 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=300&q=80'),
(20, 'Jus de Gingembre Fifi', 'Jus de gingembre maison, frais et épicé', 600, TRUE, 'Boisson', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=300&q=80');

-- 4) Image par défaut pour tout plat qui n'en aurait toujours pas
UPDATE menus SET image_url = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80'
WHERE image_url IS NULL;

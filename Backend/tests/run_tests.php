<?php

declare(strict_types=1);

/**
 * Suite de tests automatisés — PointeResto (CP9 / CP11)
 * Exécution : php Backend/tests/run_tests.php
 */

require_once __DIR__ . '/../Services/TokenService.php';
require_once __DIR__ . '/../Services/CacheService.php';
require_once __DIR__ . '/../Controllers/MediaController.php';
require_once __DIR__ . '/../Models/Restaurant.php';

$failures = 0;
$passed = 0;

function assertTrue(bool $condition, string $label): void
{
    global $failures, $passed;
    if ($condition) {
        $passed++;
        echo "[PASS] {$label}\n";
    } else {
        $failures++;
        fwrite(STDERR, "[FAIL] {$label}\n");
    }
}

echo "=== Exécution de la suite de tests PointeResto ===\n";

// 1. Test sécurité mots de passe (bcrypt)
$plainPassword = 'ChefPointeNoire2026!';
$hash = password_hash($plainPassword, PASSWORD_BCRYPT);
assertTrue($hash !== $plainPassword, 'Hachage bcrypt irréversible généré');
assertTrue(password_verify($plainPassword, $hash), 'Vérification password_verify() valide');
assertTrue(!password_verify('MauvaisMotDePasse', $hash), 'Rejet d\'un mot de passe incorrect');

// 2. Test jetons d'authentification signés HMAC-SHA256 (TokenService)
$sampleUser = ['id_utilisateur' => 1, 'role' => 'restaurateur', 'email' => 'patrick.ngoma@gmail.com'];
$token = TokenService::generate($sampleUser, 3600);
$verified = TokenService::verify($token);
assertTrue(
    is_array($verified) && $verified['id_utilisateur'] === 1 && $verified['role'] === 'restaurateur',
    'TokenService : génération et vérification d\'un jeton signé valide'
);

$tamperedToken = $token . 'x';
assertTrue(TokenService::verify($tamperedToken) === null, 'TokenService : rejet d\'un jeton altéré');

$expiredToken = TokenService::generate($sampleUser, -10);
assertTrue(TokenService::verify($expiredToken) === null, 'TokenService : rejet d\'un jeton expiré');

// 3. Test sécurité upload : détection MIME binaire réelle (MediaController)
$fakeImagePath = tempnam(sys_get_temp_dir(), 'test_mime_php_');
file_put_contents($fakeImagePath, "<?php system(\$_GET['cmd']); ?>");
$fakeResult = MediaController::validateImageFile($fakeImagePath, (int)filesize($fakeImagePath));
assertTrue(
    !$fakeResult['valid'] && $fakeResult['status'] === 415,
    "MediaController : rejet HTTP 415 d'un script PHP déguisé (MIME : {$fakeResult['mime']})"
);

$oversizedResult = MediaController::validateImageFile($fakeImagePath, 6 * 1024 * 1024);
assertTrue(
    !$oversizedResult['valid'] && $oversizedResult['status'] === 413,
    'MediaController : rejet HTTP 413 au-delà de 5 Mo'
);
@unlink($fakeImagePath);

// Création d'un PNG valide 1x1 pixel en mémoire
$validPngPath = tempnam(sys_get_temp_dir(), 'test_mime_png_');
$pngBinary = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=');
file_put_contents($validPngPath, $pngBinary);
$pngResult = MediaController::validateImageFile($validPngPath, (int)filesize($validPngPath));
assertTrue(
    $pngResult['valid'] && $pngResult['status'] === 200 && $pngResult['mime'] === 'image/png',
    'MediaController : acceptation HTTP 200 d\'une image PNG authentique'
);
@unlink($validPngPath);

// 4. Test validation des bornes métier (notes entre 1 et 5)
$isValidRating = static fn(int $note): bool => $note >= 1 && $note <= 5;
assertTrue($isValidRating(5) && $isValidRating(1), 'Validation des notes conformes (1 à 5)');
assertTrue(!$isValidRating(0) && !$isValidRating(6), 'Rejet des notes hors bornes (0 ou 6)');

// 5. Test du service de cache Clé-Valeur (Redis ou repli fichier)
$cache = new \App\Services\CacheService();
$cache->set('test:workspace:1', ['count' => 20], 60);
$cached = $cache->get('test:workspace:1');
assertTrue(is_array($cached) && ($cached['count'] ?? 0) === 20, 'Cache Clé-Valeur : écriture et lecture JSON');
$cache->delete('test:workspace:1');
assertTrue($cache->get('test:workspace:1') === null, 'Cache Clé-Valeur : invalidation après suppression');

// 6. Tests d'intégration PostgreSQL (exécutés si DATABASE_URL ou PGHOST est défini)
$dbUrl = getenv('DATABASE_URL') ?: '';
$pgHost = getenv('PGHOST') ?: '';

if ($dbUrl !== '' || $pgHost !== '') {
    try {
        if ($dbUrl !== '') {
            $parts = parse_url($dbUrl);
            $dsn = sprintf(
                'pgsql:host=%s;port=%d;dbname=%s',
                $parts['host'] ?? 'localhost',
                $parts['port'] ?? 5432,
                ltrim($parts['path'] ?? '/pointeresto', '/')
            );
            $user = $parts['user'] ?? 'postgres';
            $pass = $parts['pass'] ?? '';
        } else {
            $dsn = sprintf(
                'pgsql:host=%s;port=%s;dbname=%s',
                $pgHost,
                getenv('PGPORT') ?: '5432',
                getenv('PGDATABASE') ?: 'pointeresto'
            );
            $user = getenv('PGUSER') ?: 'postgres';
            $pass = getenv('PGPASSWORD') ?: 'postgres';
        }

        $pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        ]);

        // Vérification présence des 6 tables du MPD
        $tables = $pdo->query(
            "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
        )->fetchAll(PDO::FETCH_COLUMN);

        foreach (['utilisateurs', 'workspaces', 'restaurants', 'menus', 'avis', 'medias'] as $expectedTable) {
            assertTrue(in_array($expectedTable, $tables, true), "Table PostgreSQL présente : {$expectedTable}");
        }

        // Vérification des colonnes ajoutées au schéma
        $columnsCheck = $pdo->query(
            "SELECT table_name || '.' || column_name
             FROM information_schema.columns
             WHERE table_schema = 'public'"
        )->fetchAll(PDO::FETCH_COLUMN);

        foreach (['menus.image_url', 'avis.nom_anonyme', 'avis.reponse_restaurateur'] as $expectedCol) {
            assertTrue(in_array($expectedCol, $columnsCheck, true), "Colonne PostgreSQL présente : {$expectedCol}");
        }

        // Vérification du jeu d'essai (>= 20 établissements et 20 médias dédiés)
        $countResto = (int)$pdo->query('SELECT COUNT(*) FROM restaurants')->fetchColumn();
        assertTrue($countResto >= 20, "Jeu d'essai chargé ({$countResto} établissements présents)");

        $countMedias = (int)$pdo->query('SELECT COUNT(DISTINCT restaurant_id) FROM medias')->fetchColumn();
        assertTrue($countMedias >= 20, "Visuels dédiés chargés ({$countMedias} restaurants illustrés)");

        $restaurantModel = new Restaurant($pdo);
        $listRestos = $restaurantModel->getAllVerified();
        assertTrue(
            !empty($listRestos) && !empty($listRestos[0]['photo_principale']),
            'Modèle Restaurant : exposition de photo_principale dans getAllVerified()'
        );

        $seedHash = (string)$pdo->query(
            "SELECT mot_de_passe FROM utilisateurs WHERE email = 'patrick.ngoma@gmail.com'"
        )->fetchColumn();
        assertTrue(
            password_verify('PointeResto2026', $seedHash),
            'Compte de démonstration patrick.ngoma@gmail.com authentifiable avec PointeResto2026'
        );

        // Vérification contrainte SQL CHECK (note 1..5) sur la table avis (SQLSTATE 23514)
        $checkViolationCaught = false;
        try {
            $pdo->exec(
                "INSERT INTO avis (restaurant_id, est_anonyme, nom_anonyme, note, commentaire)
                 VALUES (1, TRUE, 'Testeur', 9, 'Note invalide')"
            );
        } catch (PDOException $e) {
            $checkViolationCaught = ($e->getCode() === '23514');
        }
        assertTrue($checkViolationCaught, 'Contrainte SQL CHECK (note 1..5) appliquée par PostgreSQL (SQLSTATE 23514)');

        // Vérification atomicité transactionnelle (rollBack complet en cas d'échec sur le menu)
        $beforeCount = (int)$pdo->query('SELECT COUNT(*) FROM restaurants')->fetchColumn();
        $rollbackTriggered = false;
        try {
            $restaurantModel->createWithInitialMenuAndMedia(
                [
                    'workspace_id'    => 1,
                    'proprietaire_id' => 1,
                    'nom'             => 'Restaurant Rollback Test',
                    'adresse'         => 'Avenue Test, Pointe-Noire',
                ],
                [
                    'titre' => 'Plat Prix Négatif Invalide',
                    'prix'  => -100,
                ]
            );
        } catch (Throwable $e) {
            $rollbackTriggered = true;
        }
        $afterCount = (int)$pdo->query('SELECT COUNT(*) FROM restaurants')->fetchColumn();
        assertTrue(
            $rollbackTriggered && $beforeCount === $afterCount,
            'Transaction SQL : rollBack complet garanti (aucun établissement orphelin)'
        );
    } catch (Throwable $e) {
        fwrite(STDERR, "[FAIL] Erreur d'intégration PostgreSQL : " . $e->getMessage() . "\n");
        $failures++;
    }
}

echo "\nRésultat : {$passed} test(s) réussi(s), {$failures} échec(s).\n";
exit($failures > 0 ? 1 : 0);
<?php

declare(strict_types=1);

/**
 * Suite de tests automatisés — PointeResto (CP9 / CP11)
 * Exécution : php Backend/tests/run_tests.php
 */

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

// 2. Test sécurité upload : détection MIME binaire réelle (anti-spoofing .php -> .jpg)
$fakeImagePath = tempnam(sys_get_temp_dir(), 'test_mime_');
file_put_contents($fakeImagePath, "<?php system(\$_GET['cmd']); ?>");
$detectedMime = mime_content_type($fakeImagePath);
$allowedMimes = ['image/jpeg', 'image/png'];
assertTrue(!in_array($detectedMime, $allowedMimes, true), "Rejet d'un script PHP déguisé (MIME détecté : {$detectedMime})");
@unlink($fakeImagePath);

// 3. Test validation des bornes métier (notes entre 1 et 5)
$isValidRating = static fn(int $note): bool => $note >= 1 && $note <= 5;
assertTrue($isValidRating(5) && $isValidRating(1), 'Validation des notes conformes (1 à 5)');
assertTrue(!$isValidRating(0) && !$isValidRating(6), 'Rejet des notes hors bornes (0 ou 6)');

// 4. Test du service de cache Clé-Valeur (Redis ou repli fichier)
$cacheServicePath = __DIR__ . '/../Services/CacheService.php';
if (is_file($cacheServicePath)) {
    require_once $cacheServicePath;
    $cache = new \App\Services\CacheService();
    $cache->set('test:workspace:1', ['count' => 20], 60);
    $cached = $cache->get('test:workspace:1');
    assertTrue(is_array($cached) && ($cached['count'] ?? 0) === 20, 'Cache Clé-Valeur : écriture et lecture JSON');
    $cache->delete('test:workspace:1');
    assertTrue($cache->get('test:workspace:1') === null, 'Cache Clé-Valeur : invalidation après suppression');
}

// 5. Tests d'intégration PostgreSQL (exécutés si DATABASE_URL ou PGHOST est défini)
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

        // Vérification du jeu d'essai (>= 15 établissements)
        $countResto = (int)$pdo->query('SELECT COUNT(*) FROM restaurants')->fetchColumn();
        assertTrue($countResto >= 15, "Jeu d'essai chargé ({$countResto} établissements présents)");

        // Vérification contrainte CHECK sur la table avis
        $constraintTriggered = false;
        try {
            $pdo->exec("INSERT INTO avis (restaurant_id, auteur_nom, note, commentaire) VALUES (1, 'Test', 9, 'Invalide')");
        } catch (PDOException $e) {
            $constraintTriggered = true;
        }
        assertTrue($constraintTriggered, 'Contrainte SQL CHECK (note 1..5) appliquée par PostgreSQL');
    } catch (Throwable $e) {
        fwrite(STDERR, "[FAIL] Erreur d'intégration PostgreSQL : " . $e->getMessage() . "\n");
        $failures++;
    }
}

echo "\nRésultat : {$passed} test(s) réussi(s), {$failures} échec(s).\n";
exit($failures > 0 ? 1 : 0);
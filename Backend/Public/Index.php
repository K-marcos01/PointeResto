<?php

$corsEnv = trim((string)(getenv('CORS_ORIGIN') ?: ''));
$requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';

if ($corsEnv !== '') {
    $allowedOrigins = array_map('trim', explode(',', $corsEnv));
    if (in_array('*', $allowedOrigins, true)) {
        header('Access-Control-Allow-Origin: *');
    } elseif ($requestOrigin !== '' && in_array($requestOrigin, $allowedOrigins, true)) {
        header("Access-Control-Allow-Origin: {$requestOrigin}");
        header('Vary: Origin');
    } else {
        header('Access-Control-Allow-Origin: ' . $allowedOrigins[0]);
        header('Vary: Origin');
    }
} else {
    $appEnv = getenv('APP_ENV') ?: 'development';
    header('Access-Control-Allow-Origin: ' . ($appEnv === 'production' ? 'https://k-marcos01.github.io' : '*'));
}

header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit(0);
}

require_once __DIR__ . '/../Config/db.php';
require_once __DIR__ . '/../Services/TokenService.php';
require_once __DIR__ . '/../Controllers/RestaurantController.php';
require_once __DIR__ . '/../Controllers/ReviewController.php';
require_once __DIR__ . '/../Controllers/AuthController.php';
require_once __DIR__ . '/../Controllers/MediaController.php';
require_once __DIR__ . '/../Controllers/MenuController.php';
require_once __DIR__ . '/../Controllers/DashboardController.php';

function json_get_input(): array {
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

$route = $_GET['route'] ?? '';

if ($route === 'health') {
    echo json_encode(['status' => 'ok', 'service' => 'PointeResto API']);
    exit(0);
}

$db = (new Database())->connect();

switch ($route) {
    case 'restaurants':
        (new RestaurantController($db))->handleRequest();
        break;
    case 'reviews':
        (new ReviewController($db))->handleRequest();
        break;
    case 'auth':
        (new AuthController($db))->handleRequest();
        break;
    case 'medias':
        (new MediaController($db))->handleRequest();
        break;
    case 'menus':
        (new MenuController($db))->handleRequest();
        break;
    case 'dashboard':
        (new DashboardController($db))->handleRequest();
        break;
    default:
        http_response_code(404);
        echo json_encode(['message' => 'Route non trouvée']);
        break;
}
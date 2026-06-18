<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../Config/db.php';
require_once __DIR__ . '/../Controllers/RestaurantController.php';
require_once __DIR__ . '/../Controllers/ReviewController.php';
require_once __DIR__ . '/../Controllers/AuthController.php';
require_once __DIR__ . '/../Controllers/MediaController.php';
require_once __DIR__ . '/../Controllers/MenuController.php';
require_once __DIR__ . '/../Controllers/DashboardController.php';

function json_get_input() {
    return json_decode(file_get_contents("php://input"), true) ?? [];
}

$db = (new Database())->connect();
$route = $_GET['route'] ?? '';

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
        echo json_encode(["message" => "Route non trouvée"]);
        break;
}
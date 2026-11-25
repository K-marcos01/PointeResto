<?php

require_once __DIR__ . '/../Models/DashboardData.php';
require_once __DIR__ . '/../Services/TokenService.php';
require_once __DIR__ . '/../Services/CacheService.php';

use App\Services\CacheService;

class DashboardController {
    private DashboardData $model;

    public function __construct($db) {
        $this->model = new DashboardData($db);
    }

    public function handleRequest(): void {
        $authUser = TokenService::getAuthenticatedUser();
        if ($authUser === null) {
            http_response_code(401);
            echo json_encode(['message' => 'Non authentifié ou jeton expiré.']);
            return;
        }

        if (!in_array($authUser['role'], ['restaurateur', 'moderateur'], true)) {
            http_response_code(403);
            echo json_encode(['message' => 'Accès réservé aux restaurateurs et modérateurs.']);
            return;
        }

        $userId = (int)$authUser['id_utilisateur'];
        $method = $_SERVER['REQUEST_METHOD'];
        $action = $_GET['action'] ?? 'stats';

        if ($method === 'GET') {
            $this->handleGet($action, $userId);
            return;
        }

        if ($method === 'POST') {
            $input = json_get_input();
            $postAction = (string)($input['action'] ?? $action);
            $this->handlePost($postAction, $userId, $input);
            return;
        }

        http_response_code(405);
        echo json_encode(['message' => 'Méthode HTTP non autorisée.']);
    }

    private function handleGet(string $action, int $userId): void {
        if ($action === 'stats') {
            echo json_encode($this->model->getStats($userId));
            return;
        }
        if ($action === 'restaurants') {
            echo json_encode($this->model->getRestaurantsByOwner($userId));
            return;
        }
        if ($action === 'menus' && isset($_GET['restaurant_id'])) {
            echo json_encode($this->model->getMenus((int)$_GET['restaurant_id'], $userId));
            return;
        }
        if ($action === 'avis') {
            echo json_encode($this->model->getAvisByOwner($userId));
            return;
        }

        http_response_code(404);
        echo json_encode(['message' => 'Action introuvable']);
    }

    private function handlePost(string $action, int $userId, array $input): void {
        if ($action === 'status') {
            $restaurantId = (int)($input['restaurant_id'] ?? 0);
            $statut = (string)($input['statut'] ?? '');
            $ok = $this->model->updateStatus($restaurantId, $userId, $statut);
            if ($ok) {
                (new CacheService())->delete('restaurants:all');
            }
            echo json_encode(['success' => $ok]);
            return;
        }

        if ($action === 'menu-add') {
            $restaurantId = (int)($input['restaurant_id'] ?? 0);
            $titre = trim((string)($input['titre'] ?? ''));
            $prix = isset($input['prix']) ? (int)$input['prix'] : -1;
            if ($restaurantId <= 0 || $titre === '' || $prix < 0) {
                http_response_code(400);
                echo json_encode(['message' => 'Titre et prix valide requis.']);
                return;
            }
            $ok = $this->model->addMenu($restaurantId, $userId, $input);
            echo json_encode(['success' => $ok]);
            return;
        }

        if ($action === 'menu-update') {
            $menuId = (int)($input['id_menu'] ?? 0);
            $titre = trim((string)($input['titre'] ?? ''));
            $prix = isset($input['prix']) ? (int)$input['prix'] : -1;
            if ($menuId <= 0 || $titre === '' || $prix < 0) {
                http_response_code(400);
                echo json_encode(['message' => 'Données du plat invalides.']);
                return;
            }
            $ok = $this->model->updateMenu($menuId, $userId, $input);
            echo json_encode(['success' => $ok]);
            return;
        }

        if ($action === 'menu-delete') {
            $menuId = (int)($input['id_menu'] ?? 0);
            if ($menuId <= 0) {
                http_response_code(400);
                echo json_encode(['message' => 'Identifiant du plat manquant.']);
                return;
            }
            $ok = $this->model->deleteMenu($menuId, $userId);
            echo json_encode(['success' => $ok]);
            return;
        }

        if ($action === 'repondre-avis') {
            $avisId = (int)($input['id_avis'] ?? 0);
            $reponse = trim((string)($input['reponse'] ?? ''));
            if ($avisId <= 0 || $reponse === '') {
                http_response_code(400);
                echo json_encode(['message' => 'Réponse invalide.']);
                return;
            }
            $ok = $this->model->repondreAvis($avisId, $userId, $reponse);
            echo json_encode(['success' => $ok]);
            return;
        }

        http_response_code(400);
        echo json_encode(['message' => 'Action non reconnue']);
    }
}
<?php
require_once __DIR__ . '/../Models/DashboardData.php';

class DashboardController {
    private $model;

    public function __construct($db) {
        $this->model = new DashboardData($db);
    }

    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $action = $_GET['action'] ?? 'stats';

        if ($method === 'GET') {
            $userId = intval($_GET['user_id'] ?? 0);
            $this->handleGet($action, $userId);
            return;
        }

        if ($method === 'POST') {
            $input  = json_get_input();
            $userId = intval($input['user_id'] ?? 0);
            $this->handlePost($action, $userId, $input);
            return;
        }

        http_response_code(405);
    }

    private function handleGet($action, $userId) {
        if (!$userId) { http_response_code(401); echo json_encode(['message' => 'Non authentifié']); return; }

        if ($action === 'stats') {
            echo json_encode($this->model->getStats($userId));
            return;
        }
        if ($action === 'restaurants') {
            echo json_encode($this->model->getRestaurantsByOwner($userId));
            return;
        }
        if ($action === 'menus' && isset($_GET['restaurant_id'])) {
            echo json_encode($this->model->getMenus(intval($_GET['restaurant_id']), $userId));
            return;
        }
        if ($action === 'avis') {
            echo json_encode($this->model->getAvisByOwner($userId));
            return;
        }

        http_response_code(404);
        echo json_encode(['message' => 'Action introuvable']);
    }

    private function handlePost($action, $userId, $input) {
        if (!$userId) { http_response_code(401); echo json_encode(['message' => 'Non authentifié']); return; }

        if ($action === 'status') {
            $ok = $this->model->updateStatus(intval($input['restaurant_id']), $userId, $input['statut']);
            echo json_encode(['success' => $ok]);
            return;
        }
        if ($action === 'menu-add') {
            $ok = $this->model->addMenu(intval($input['restaurant_id']), $userId, $input);
            echo json_encode(['success' => $ok]);
            return;
        }
        if ($action === 'menu-update') {
            $ok = $this->model->updateMenu(intval($input['id_menu']), $userId, $input);
            echo json_encode(['success' => $ok]);
            return;
        }
        if ($action === 'menu-delete') {
            $ok = $this->model->deleteMenu(intval($input['id_menu']), $userId);
            echo json_encode(['success' => $ok]);
            return;
        }
        if ($action === 'repondre-avis') {
            $ok = $this->model->repondreAvis(intval($input['id_avis']), $userId, $input['reponse']);
            echo json_encode(['success' => $ok]);
            return;
        }

        http_response_code(400);
        echo json_encode(['message' => 'Action non reconnue']);
    }
}

<?php
require_once __DIR__ . '/../Models/DashboardData.php';

class DashboardController {
    private $model;

    public function __construct($db) {
        $this->model = new DashboardData($db);
    }

    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        
        if ($method === 'GET' && isset($_GET['user_id'])) {
            $userId = intval($_GET['user_id']);
            echo json_encode($this->model->getStats($userId));
            return;
        }

        if ($method === 'POST') {
            $input = json_get_input();
            if (!empty($input['restaurant_id']) && !empty($input['statut'])) {
                $success = $this->model->updateStatus($input['restaurant_id'], $input['statut']);
                echo json_encode(["success" => $success]);
                return;
            }
            http_response_code(400);
            return;
        }

        http_response_code(405);
    }
}
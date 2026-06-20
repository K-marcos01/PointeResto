<?php
require_once __DIR__ . '/../Models/Restaurant.php';

class RestaurantController {
    private $restaurantModel;

    public function __construct($db) {
        $this->restaurantModel = new Restaurant($db);
    }

    public function handleRequest() {
        $action = $_GET['action'] ?? 'list';

        if ($action === 'quartiers') {
            echo json_encode($this->restaurantModel->getQuartiers());
            return;
        }

        if ($action === 'detail') {
            $id = intval($_GET['id'] ?? 0);
            $restaurant = $this->restaurantModel->getById($id);
            if ($restaurant) {
                echo json_encode($restaurant);
            } else {
                http_response_code(404);
                echo json_encode(["message" => "Restaurant introuvable."]);
            }
            return;
        }

        if ($action === 'list') {
            $workspace = !empty($_GET['workspace']) ? intval($_GET['workspace']) : null;
            $search = !empty($_GET['search']) ? trim($_GET['search']) : null;
            
            $results = $this->restaurantModel->getAllVerified($workspace, $search);
            echo json_encode($results);
            return;
        }

        http_response_code(404);
        echo json_encode(["message" => "Action non trouvée"]);
    }
}
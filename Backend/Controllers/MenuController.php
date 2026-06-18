<?php
require_once __DIR__ . '/../Models/Menu.php';

class MenuController {
    private $menuModel;

    public function __construct($db) {
        $this->menuModel = new Menu($db);
    }

    public function handleRequest() {
        if ($_SERVER['REQUEST_METHOD'] !== 'GET' || !isset($_GET['restaurant_id'])) {
            http_response_code(400);
            echo json_encode(["message" => "ID Restaurant manquant"]);
            return;
        }

        $restaurantId = intval($_GET['restaurant_id']);
        $items = $this->menuModel->getMenuByRestaurant($restaurantId);
        echo json_encode($items);
    }
}
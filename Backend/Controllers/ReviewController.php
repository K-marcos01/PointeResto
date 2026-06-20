<?php
require_once __DIR__ . '/../Models/Review.php';

class ReviewController {
    private $reviewModel;

    public function __construct($db) {
        $this->reviewModel = new Review($db);
    }

    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];

        if ($method === 'GET' && isset($_GET['restaurant_id'])) {
            $id = intval($_GET['restaurant_id']);
            echo json_encode($this->reviewModel->getReviewsByRestaurant($id));
            return;
        }

        if ($method === 'POST') {
            $input = json_get_input();

            // Modification d'un avis existant
            if (!empty($input['id_avis'])) {
                $this->update($input);
                return;
            }

            // Création d'un nouvel avis
            if (empty($input['restaurant_id']) || empty($input['note'])) {
                http_response_code(400);
                echo json_encode(["message" => "Données incomplètes"]);
                return;
            }
            $input['adresse_ip'] = $_SERVER['REMOTE_ADDR'];
            $success = $this->reviewModel->createReview($input);
            echo json_encode(["success" => $success]);
            return;
        }

        http_response_code(400);
    }

    private function update($input) {
        if (empty($input['note'])) {
            http_response_code(400);
            echo json_encode(["message" => "La note est requise."]);
            return;
        }

        $success = $this->reviewModel->updateReview(
            intval($input['id_avis']),
            intval($input['utilisateur_id'] ?? 0),
            intval($input['note']),
            trim($input['commentaire'] ?? '')
        );

        if ($success) {
            echo json_encode(["success" => true]);
        } else {
            http_response_code(403);
            echo json_encode(["message" => "Modification refusée."]);
        }
    }
}

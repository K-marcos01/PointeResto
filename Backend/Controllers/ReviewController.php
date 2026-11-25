<?php

require_once __DIR__ . '/../Models/Review.php';
require_once __DIR__ . '/../Services/TokenService.php';
require_once __DIR__ . '/../Services/CacheService.php';

use App\Services\CacheService;

class ReviewController {
    private $db;
    private Review $reviewModel;

    public function __construct($db) {
        $this->db = $db;
        $this->reviewModel = new Review($db);
    }

    public function handleRequest(): void {
        $method = $_SERVER['REQUEST_METHOD'];

        if ($method === 'GET' && isset($_GET['restaurant_id'])) {
            $id = (int)$_GET['restaurant_id'];
            echo json_encode($this->reviewModel->getReviewsByRestaurant($id));
            return;
        }

        if ($method === 'POST') {
            $input = json_get_input();

            if (!empty($input['id_avis'])) {
                $this->update($input);
                return;
            }

            $this->create($input);
            return;
        }

        http_response_code(400);
        echo json_encode(['message' => 'Requête invalide.']);
    }

    private function create(array $input): void {
        $restaurantId = (int)($input['restaurant_id'] ?? 0);
        $note = (int)($input['note'] ?? 0);

        if ($restaurantId <= 0 || $note < 1 || $note > 5) {
            http_response_code(400);
            echo json_encode(['message' => 'Établissement ou note invalide (1 à 5).']);
            return;
        }

        $clientIp = $this->getClientIp();

        // Contrôle anti-spam (Rate Limiting) : maximum 5 avis par minute et par IP
        $spamStmt = $this->db->prepare(
            "SELECT COUNT(*) FROM avis
             WHERE adresse_ip = :ip AND date_publication >= NOW() - INTERVAL '1 minute'"
        );
        $spamStmt->execute([':ip' => $clientIp]);
        if ((int)$spamStmt->fetchColumn() >= 5) {
            http_response_code(429);
            echo json_encode(['message' => 'Trop d\'avis envoyés récemment. Veuillez patienter une minute.']);
            return;
        }

        // Si un jeton Bearer valide est fourni, on associe l'avis au compte authentifié
        $authUser = TokenService::getAuthenticatedUser();
        $utilisateurId = ($authUser !== null) ? (int)$authUser['id_utilisateur'] : null;

        $payload = [
            'restaurant_id'  => $restaurantId,
            'utilisateur_id' => $utilisateurId,
            'note'           => $note,
            'commentaire'    => isset($input['commentaire']) ? trim((string)$input['commentaire']) : null,
            'nom_anonyme'    => $utilisateurId === null
                ? (trim((string)($input['nom_anonyme'] ?? '')) ?: 'Visiteur Anonyme')
                : null,
            'adresse_ip'     => $clientIp,
        ];

        $success = $this->reviewModel->createReview($payload);
        if ($success) {
            $this->refreshRestaurantAverage($restaurantId);
            http_response_code(201);
            echo json_encode(['success' => true]);
        } else {
            http_response_code(500);
            echo json_encode(['message' => 'Impossible d\'enregistrer l\'avis.']);
        }
    }

    private function update(array $input): void {
        $authUser = TokenService::getAuthenticatedUser();
        if ($authUser === null) {
            http_response_code(401);
            echo json_encode(['message' => 'Authentification requise pour modifier un avis.']);
            return;
        }

        $note = (int)($input['note'] ?? 0);
        if ($note < 1 || $note > 5) {
            http_response_code(400);
            echo json_encode(['message' => 'La note doit être comprise entre 1 et 5.']);
            return;
        }

        $idAvis = (int)$input['id_avis'];
        $utilisateurId = (int)$authUser['id_utilisateur'];

        $success = $this->reviewModel->updateReview(
            $idAvis,
            $utilisateurId,
            $note,
            trim((string)($input['commentaire'] ?? ''))
        );

        if ($success) {
            $restoStmt = $this->db->prepare('SELECT restaurant_id FROM avis WHERE id_avis = :id');
            $restoStmt->execute([':id' => $idAvis]);
            $restaurantId = (int)$restoStmt->fetchColumn();
            if ($restaurantId > 0) {
                $this->refreshRestaurantAverage($restaurantId);
            }
            echo json_encode(['success' => true]);
        } else {
            http_response_code(403);
            echo json_encode(['message' => 'Modification refusée.']);
        }
    }

    private function refreshRestaurantAverage(int $restaurantId): void {
        $stmt = $this->db->prepare(
            "UPDATE restaurants
             SET note_moyenne = COALESCE((
                 SELECT ROUND(AVG(note)::numeric, 1)
                 FROM avis
                 WHERE restaurant_id = :rid1 AND statut_moderation = 'approuve'
             ), 0.0)
             WHERE id_restaurant = :rid2"
        );
        $stmt->execute([':rid1' => $restaurantId, ':rid2' => $restaurantId]);
        (new CacheService())->delete('restaurants:all');
    }

    private function getClientIp(): string {
        $forwarded = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '';
        if ($forwarded !== '') {
            $ips = array_map('trim', explode(',', $forwarded));
            if (!empty($ips[0]) && filter_var($ips[0], FILTER_VALIDATE_IP)) {
                return $ips[0];
            }
        }
        $remote = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        return filter_var($remote, FILTER_VALIDATE_IP) ? $remote : '127.0.0.1';
    }
}
<?php

require_once __DIR__ . '/../Services/TokenService.php';
require_once __DIR__ . '/../Services/CacheService.php';

use App\Services\CacheService;

class MediaController {
    private const MAX_FILE_SIZE = 5242880; // 5 Mo
    private const ALLOWED_MIMES = [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
    ];

    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function handleRequest(): void {
        $method = $_SERVER['REQUEST_METHOD'];

        if ($method === 'GET') {
            $this->listByRestaurant();
            return;
        }

        if ($method === 'POST') {
            $this->upload();
            return;
        }

        http_response_code(405);
        echo json_encode(['message' => 'Méthode HTTP non autorisée.']);
    }

    private function listByRestaurant(): void {
        $restaurantId = (int)($_GET['restaurant_id'] ?? 0);
        if ($restaurantId <= 0) {
            http_response_code(400);
            echo json_encode(['message' => 'Identifiant de restaurant manquant.']);
            return;
        }

        $sql = 'SELECT id_media, nom_fichier, type_mime, taille, date_upload, chemin_fichier
                FROM medias
                WHERE restaurant_id = :res_id
                ORDER BY date_upload DESC';
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':res_id' => $restaurantId]);
        echo json_encode($stmt->fetchAll());
    }

    private function upload(): void {
        $authUser = TokenService::getAuthenticatedUser();
        if ($authUser === null) {
            http_response_code(401);
            echo json_encode(['message' => 'Authentification requise pour téléverser un média.']);
            return;
        }

        if (!in_array($authUser['role'], ['restaurateur', 'moderateur'], true)) {
            http_response_code(403);
            echo json_encode(['message' => 'Accès réservé aux restaurateurs et modérateurs.']);
            return;
        }

        $restaurantId = (int)($_POST['restaurant_id'] ?? 0);
        if ($restaurantId <= 0) {
            http_response_code(400);
            echo json_encode(['message' => 'Identifiant de restaurant requis.']);
            return;
        }

        // Vérifier que l'établissement appartient bien au restaurateur connecté
        if ($authUser['role'] === 'restaurateur') {
            $ownerStmt = $this->db->prepare(
                'SELECT 1 FROM restaurants WHERE id_restaurant = :rid AND proprietaire_id = :owner'
            );
            $ownerStmt->execute([
                ':rid'   => $restaurantId,
                ':owner' => (int)$authUser['id_utilisateur'],
            ]);
            if (!$ownerStmt->fetch()) {
                http_response_code(403);
                echo json_encode(['message' => 'Vous n\'êtes pas propriétaire de cet établissement.']);
                return;
            }
        }

        $file = $_FILES['media'] ?? ($_FILES['file'] ?? null);
        if (!is_array($file) || ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            http_response_code(400);
            echo json_encode(['message' => 'Aucun fichier valide reçu.']);
            return;
        }

        $tmpPath = (string)($file['tmp_name'] ?? '');
        $sizeBytes = (int)($file['size'] ?? 0);

        $validation = self::validateImageFile($tmpPath, $sizeBytes);
        if (!$validation['valid']) {
            http_response_code($validation['status']);
            echo json_encode(['message' => $validation['message']]);
            return;
        }

        $mime = $validation['mime'];
        $extension = self::ALLOWED_MIMES[$mime];
        $safeFilename = bin2hex(random_bytes(16)) . '.' . $extension;
        $uploadDir = __DIR__ . '/../Public/uploads';

        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $destination = $uploadDir . '/' . $safeFilename;
        if (!move_uploaded_file($tmpPath, $destination)) {
            http_response_code(500);
            echo json_encode(['message' => 'Erreur lors de l\'enregistrement du fichier sur le serveur.']);
            return;
        }

        $relativePath = 'uploads/' . $safeFilename;
        $sizeKb = round($sizeBytes / 1024, 2);

        $insert = $this->db->prepare(
            'INSERT INTO medias (restaurant_id, nom_fichier, type_mime, taille, chemin_fichier)
             VALUES (:restaurant_id, :nom_fichier, :type_mime, :taille, :chemin_fichier)
             RETURNING id_media, restaurant_id, nom_fichier, type_mime, taille, date_upload, chemin_fichier'
        );
        $insert->execute([
            ':restaurant_id'  => $restaurantId,
            ':nom_fichier'    => substr(basename((string)($file['name'] ?? $safeFilename)), 0, 255),
            ':type_mime'      => $mime,
            ':taille'         => $sizeKb,
            ':chemin_fichier' => $relativePath,
        ]);

        $media = $insert->fetch();
        (new CacheService())->delete('restaurants:all');

        http_response_code(201);
        echo json_encode([
            'success' => true,
            'media'   => $media,
        ]);
    }

    /**
     * Valide la taille et la signature binaire réelle d'une image (anti-spoofing d'extension).
     */
    public static function validateImageFile(string $filePath, int $sizeBytes): array {
        if ($filePath === '' || !is_file($filePath)) {
            return [
                'valid'   => false,
                'status'  => 400,
                'mime'    => '',
                'message' => 'Fichier introuvable pour analyse.',
            ];
        }

        if ($sizeBytes <= 0 || $sizeBytes > self::MAX_FILE_SIZE) {
            return [
                'valid'   => false,
                'status'  => 413,
                'mime'    => '',
                'message' => 'La taille du fichier ne doit pas dépasser 5 Mo.',
            ];
        }

        $detectedMime = (string)mime_content_type($filePath);
        if (!array_key_exists($detectedMime, self::ALLOWED_MIMES)) {
            return [
                'valid'   => false,
                'status'  => 415,
                'mime'    => $detectedMime,
                'message' => 'Type de fichier non supporté. Seules les images JPEG et PNG sont acceptées.',
            ];
        }

        return [
            'valid'   => true,
            'status'  => 200,
            'mime'    => $detectedMime,
            'message' => 'OK',
        ];
    }
}
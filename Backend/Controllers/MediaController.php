<?php
class MediaController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function handleRequest() {
        if ($_SERVER['REQUEST_METHOD'] !== 'GET' || !isset($_GET['restaurant_id'])) {
            http_response_code(400);
            return;
        }
        $sql = "SELECT id_media, nom_fichier, chemin_fichier FROM medias 
                WHERE restaurant_id = :res_id ORDER BY date_upload DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':res_id' => intval($_GET['restaurant_id'])]);
        echo json_encode($stmt->fetchAll());
    }
}
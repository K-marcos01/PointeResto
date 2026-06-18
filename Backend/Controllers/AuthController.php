<?php
class AuthController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function handleRequest() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            return;
        }
        $data = json_get_input();
        if (empty($data['email']) || empty($data['mot_de_passe'])) {
            http_response_code(400);
            echo json_encode(["message" => "Champs requis manquants"]);
            return;
        }
        $sql = "SELECT id_utilisateur, nom, prenom, email, mot_de_passe, role 
                FROM utilisateurs WHERE email = :email AND statut_compte = 'actif'";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':email' => $data['email']]);
        $user = $stmt->fetch();

        // Note : Comparaison directe en clair conforme au jeu de données fourni (Seed)
        if ($user && $data['mot_de_passe'] === $user['mot_de_passe']) {
            unset($user['mot_de_passe']);
            echo json_encode(["success" => true, "user" => $user]);
        } else {
            http_response_code(401);
            echo json_encode(["message" => "Identifiants invalides"]);
        }
    }
}
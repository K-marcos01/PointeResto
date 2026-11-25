<?php

require_once __DIR__ . '/../Services/TokenService.php';

class AuthController {
    private $db;

    public function __construct($db) {
        $this->db = $db;
    }

    public function handleRequest() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['message' => 'Méthode HTTP non autorisée.']);
            return;
        }

        $data = json_get_input();

        if (($data['action'] ?? '') === 'register') {
            $this->register($data);
            return;
        }

        $this->login($data);
    }

    private function login(array $data): void {
        $email    = strtolower(trim((string)($data['email'] ?? '')));
        $password = (string)($data['password'] ?? '');

        if ($email === '' || $password === '') {
            http_response_code(400);
            echo json_encode(['message' => 'Email et mot de passe requis.']);
            return;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['message' => 'Adresse email invalide.']);
            return;
        }

        $sql  = "SELECT id_utilisateur, nom, prenom, email, mot_de_passe, role
                 FROM utilisateurs WHERE email = :email AND statut_compte = 'actif'";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':email' => $email]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['mot_de_passe'])) {
            $this->db->prepare('UPDATE utilisateurs SET derniere_connexion = NOW() WHERE id_utilisateur = :id')
                     ->execute([':id' => $user['id_utilisateur']]);

            unset($user['mot_de_passe']);
            echo json_encode([
                'token' => TokenService::generate($user),
                'user'  => $user,
            ]);
        } else {
            http_response_code(401);
            echo json_encode(['message' => 'Identifiants incorrects.']);
        }
    }

    private function register(array $data): void {
        $nom      = trim((string)($data['nom'] ?? ''));
        $prenom   = trim((string)($data['prenom'] ?? ''));
        $email    = strtolower(trim((string)($data['email'] ?? '')));
        $password = (string)($data['password'] ?? '');
        $rawRole  = strtolower(trim((string)($data['role'] ?? 'client')));

        if ($nom === '' || $prenom === '' || $email === '' || $password === '') {
            http_response_code(400);
            echo json_encode(['message' => 'Tous les champs sont requis.']);
            return;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(['message' => 'Adresse email invalide.']);
            return;
        }

        if (strlen($password) < 6) {
            http_response_code(400);
            echo json_encode(['message' => 'Le mot de passe doit contenir au moins 6 caractères.']);
            return;
        }

        // Seuls les rôles client et restaurateur sont autorisés à l'inscription publique
        $role = in_array($rawRole, ['client', 'restaurateur'], true) ? $rawRole : 'client';

        $check = $this->db->prepare('SELECT id_utilisateur FROM utilisateurs WHERE email = :email');
        $check->execute([':email' => $email]);
        if ($check->fetch()) {
            http_response_code(409);
            echo json_encode(['message' => 'Un compte existe déjà avec cet email.']);
            return;
        }

        $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);

        $insert = $this->db->prepare(
            "INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role, statut_compte)
             VALUES (:nom, :prenom, :email, :mot_de_passe, :role, 'actif')
             RETURNING id_utilisateur, nom, prenom, email, role"
        );
        $insert->execute([
            ':nom'          => $nom,
            ':prenom'       => $prenom,
            ':email'        => $email,
            ':mot_de_passe' => $hash,
            ':role'         => $role,
        ]);
        $user = $insert->fetch();

        http_response_code(201);
        echo json_encode([
            'token' => TokenService::generate($user),
            'user'  => $user,
        ]);
    }
}
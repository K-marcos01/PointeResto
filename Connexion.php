<?php
$host = '127.0.0.1';
$port = '5432';
$db   = 'pointeresto';
$user = 'kpano'; 
$pass = '';

// Création de la chaîne de connexion (DSN) spécifique à PostgreSQL
$dsn = "pgsql:host=$host;
        port=$port;
        dbname=$db";

// Options de configuration de PDO pour la sécurité et le débogage
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION, // Active les erreurs sous forme d'exceptions
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // Retourne les données sous forme de tableau associatif
    PDO::ATTR_EMULATE_PREPARES   => false,                  // Utilise les vraies requêtes préparées de PostgreSQL
];

try {
    // Tentative de connexion
    $pdo = new PDO($dsn, $user, $pass, $options);
     echo "Connexion réussie à la base de données PostgreSQL !";
} catch (PDOException $e) {
    die("Erreur de connexion à la base de données : " . $e->getMessage());
}
?>
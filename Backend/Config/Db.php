<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *"); // Évite les blocages CORS en local

$host = "127.0.0.1";
$port = "5432";
$db   = "pointeresto";
$user = "kpano";
$pass = "";

try {
    $pdo = new PDO("pgsql:host=$host;
                    port=$port;
                    dbname=$db", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
} catch (PDOException $e) {
    echo json_encode(["erreur" => "Impossible de se connecter à la base de données"]);
    exit;
}
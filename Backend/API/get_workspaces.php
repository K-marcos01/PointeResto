<?php
/* POINTERESTO - API Endpoint
 * Rôle : Récupérer la liste des quartiers (Workspaces) pour les filtres du frontend.
 */

// Entêtes HTTP pour autoriser les requêtes asynchrones (AJAX) et le format JSON
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Inclusion de la connexion PDO globale
require_once '../config/connexion.php';

try {
    // Requête simple pour lister les quartiers disponibles
    $query = "SELECT id_workspace, nom_quartier, description FROM workspaces ORDER BY nom_quartier ASC";
    $stmt = $pdo->prepare($query);
    $stmt->execute();
    
    // Récupération de toutes les lignes sous forme de tableau associatif
    $workspaces = $stmt->fetchAll();
    
    // Envoi de la réponse avec un code 200 OK
    http_response_code(200);
    echo json_encode($workspaces);

} catch (PDOException $exception) {
    // En cas de problème de base de données, envoi d'une erreur 500
    http_response_code(500);
    echo json_encode([
        "error" => "Impossible de récupérer les zones géographiques.",
        "details" => $exception->getMessage()
    ]);
}
?>
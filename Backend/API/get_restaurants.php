<?php
/*POINTERESTO - API Endpoint
 * Rôle : Récupérer et filtrer la liste des restaurants depuis PostgreSQL.
 */

// Entêtes HTTP pour le format JSON et le partage des ressources (CORS)
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

// Inclusion de l'instance PDO de connexion globale
require_once '../Config/Connexion.php';

// Récupération et sécurisation du paramètre de filtrage par quartier
$workspace_id = isset($_GET['workspace_id']) ? trim($_GET['workspace_id']) : '';

try {
    // 1. Construction de la requête SQL de base
    $query = "SELECT id_restaurant, nom, adresse, statut_ouverture, type_restaurant, gamme_prix, note_moyenne 
              FROM restaurants 
              WHERE est_valide = TRUE";

    // 2. Ajout dynamique du filtre de quartier si spécifié
    if (!empty($workspace_id)) {
        $query .= " AND workspace_id = :workspace_id";
    }

    // Tri des résultats par note moyenne décroissante (les meilleurs d'abord)
    $query .= " ORDER BY note_moyenne DESC";

    // 3. Préparation et exécution de la requête
    $stmt = $pdo->prepare($query);

    if (!empty($workspace_id)) {
        $stmt->bindValue(':workspace_id', $workspace_id, PDO::PARAM_INT);
    }

    $stmt->execute();
    $restaurants = $stmt->fetchAll();

    // 4. Envoi des données au format JSON avec le code HTTP 200 OK
    http_response_code(200);
    echo json_encode($restaurants);

} catch (PDOException $exception) {
    // En cas d'erreur de base de données, renvoi d'un code 500
    http_response_code(500);
    echo json_encode([
        "error" => "Erreur lors de la récupération des établissements.",
        "details" => $exception->getMessage()
    ]);
}
?>
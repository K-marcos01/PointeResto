<?php
require_once '../Config/Db.php';

$quartier_id = $_GET['workspace_id'] ?? '';
$recherche   = $_GET['q'] ?? '';

try {
    $sql = "SELECT r.*, w.nom_quartier FROM restaurants r 
            JOIN workspaces w ON r.workspace_id = w.id_workspace 
            WHERE r.est_valide = TRUE";
    $params = [];

    if (!empty($quartier_id)) {
        $sql .= " AND r.workspace_id = ?";
        $params[] = $quartier_id;
    }

    if (!empty($recherche)) {
        $sql .= " AND (r.nom ILIKE ? OR r.type_restaurant ILIKE ?)";
        $params[] = "%$recherche%";
        $params[] = "%$recherche%";
    }

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    echo json_encode($stmt->fetchAll());
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["erreur" => $e->getMessage()]);
}
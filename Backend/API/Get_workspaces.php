<?php
require_once '../Config/Db.php';

try {
    $stmt = $pdo->query("SELECT id_workspace, nom_quartier FROM workspaces ORDER BY nom_quartier ASC");
    $quartiers = $stmt->fetchAll();
    echo json_encode($quartiers);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["erreur" => $e->getMessage()]);
}
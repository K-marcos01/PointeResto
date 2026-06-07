<?php
require_once 'Connexion.php';

try {
    // Requête pour récupérer les restaurants et leur quartier associé
    $sql = "SELECT r.nom AS restaurant, w.nom_quartier AS quartier, r.type_restaurant 
            FROM restaurants r
            JOIN workspaces w ON r.workspace_id = w.id_workspace";
            
    $stmt = $pdo->query($sql);
    $restaurants = $stmt->fetchAll();

    echo "<h1>Liste des restaurants (Données PostgreSQL)</h1>";
    echo "<ul>";
    foreach ($restaurants as $resto) {
        echo "<li><strong>" . htmlspecialchars($resto['restaurant']) . 
             "</strong> (" . htmlspecialchars($resto['type_restaurant']) . ") 
             - Situé à : " . htmlspecialchars($resto['quartier']) . "</li>";
    }
    echo "</ul>";

} catch (PDOException $e) {
    echo "Erreur lors de la récupération des données : " . $e->getMessage();
}
?>
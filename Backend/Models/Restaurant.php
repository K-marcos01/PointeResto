<?php
class Restaurant {
    private $db;

    public function __construct($dbConnection) {
        $this->db = $dbConnection;
    }

    public function getAllVerified($workspaceId = null, $searchQuery = null) {
        $sql = "SELECT r.*, w.nom_quartier FROM restaurants r 
                LEFT JOIN workspaces w ON r.workspace_id = w.id_workspace 
                WHERE r.est_valide = TRUE";
        $params = [];

        if ($workspaceId) {
            $sql .= " AND r.workspace_id = :workspace_id";
            $params[':workspace_id'] = $workspaceId;
        }

        if ($searchQuery) {
            $sql .= " AND (r.nom ILIKE :query OR r.description ILIKE :query OR r.type_restaurant ILIKE :query)";
            $params[':query'] = "%" . $searchQuery . "%";
        }

        $sql .= " ORDER BY r.note_moyenne DESC, r.nom ASC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    public function getQuartiers() {
        $sql = "SELECT id_workspace, nom_quartier FROM workspaces ORDER BY nom_quartier ASC";
        return $this->db->query($sql)->fetchAll();
    }
}
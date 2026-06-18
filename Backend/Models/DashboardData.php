<?php
class DashboardData {
    private $db;

    public function __construct($dbConnection) {
        $this->db = $dbConnection;
    }

    public function getStats($restaurateurId) {
        $sql = "SELECT 
                    COUNT(DISTINCT r.id_restaurant) as total_restos,
                    COALESCE(AVG(a.note), 0) as note_globale,
                    COUNT(DISTINCT a.id_avis) as total_avis
                FROM restaurants r
                LEFT JOIN avis a ON r.id_restaurant = a.restaurant_id
                WHERE r.utilisateur_id = :user_id";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':user_id' => $restaurateurId]);
        return $stmt->fetch();
    }

    public function updateStatus($restaurantId, $status) {
        $sql = "UPDATE restaurants 
                SET statut_ouverture = :statut 
                WHERE id_restaurant = :id";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([':statut' => $status, ':id' => $restaurantId]);
    }
}
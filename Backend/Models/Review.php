<?php
class Review {
    private $db;

    public function __construct($dbConnection) {
        $this->db = $dbConnection;
    }

    public function getReviewsByRestaurant($restaurantId) {
        $sql = "SELECT a.*, u.nom, u.prenom FROM avis a 
                LEFT JOIN utilisateurs u ON a.utilisateur_id = u.id_utilisateur 
                WHERE a.restaurant_id = :restaurant_id AND a.statut_moderation = 'approuve' 
                ORDER BY a.date_publication DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':restaurant_id' => $restaurantId]);
        return $stmt->fetchAll();
    }

    public function createReview($data) {
        $sql = "INSERT INTO avis (restaurant_id, utilisateur_id, note, commentaire, est_anonyme, adresse_ip) 
                VALUES (:restaurant_id, :utilisateur_id, :note, :commentaire, :est_anonyme, :adresse_ip)";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute($data);
    }
}
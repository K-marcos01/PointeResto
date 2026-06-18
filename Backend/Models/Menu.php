<?php
class Menu {
    private $db;

    public function __construct($dbConnection) {
        $this->db = $dbConnection;
    }

    public function getMenuByRestaurant($restaurantId) {
        $sql = "SELECT id_menu, titre, description, prix, est_disponible, categorie 
                FROM menus 
                WHERE restaurant_id = :restaurant_id AND est_disponible = TRUE 
                ORDER BY categorie ASC, titre ASC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':restaurant_id' => $restaurantId]);
        return $stmt->fetchAll();
    }
}
<?php
class DashboardData {
    private $db;

    public function __construct($dbConnection) {
        $this->db = $dbConnection;
    }

    public function getStats($restaurateurId) {
        $sql = "SELECT 
                    COUNT(DISTINCT r.id_restaurant) as total_restos,
                    COALESCE(ROUND(AVG(a.note)::numeric, 1), 0) as note_globale,
                    COUNT(DISTINCT a.id_avis) as total_avis
                FROM restaurants r
                LEFT JOIN avis a ON r.id_restaurant = a.restaurant_id
                WHERE r.proprietaire_id = :user_id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':user_id' => $restaurateurId]);
        return $stmt->fetch();
    }

    public function getRestaurantsByOwner($restaurateurId) {
        $sql = "SELECT r.*, w.nom_quartier FROM restaurants r
                LEFT JOIN workspaces w ON r.workspace_id = w.id_workspace
                WHERE r.proprietaire_id = :user_id
                ORDER BY r.date_ajout DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':user_id' => $restaurateurId]);
        return $stmt->fetchAll();
    }

    public function updateStatus($restaurantId, $proprietaireId, $status) {
        $allowed = ['Ouvert', 'Ferme bientot', 'Fermé'];
        if (!in_array($status, $allowed)) return false;
        $sql = "UPDATE restaurants SET statut_ouverture = :statut
                WHERE id_restaurant = :id AND proprietaire_id = :owner";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([':statut' => $status, ':id' => $restaurantId, ':owner' => $proprietaireId]);
    }

    // ---- Menus ----
    public function getMenus($restaurantId, $proprietaireId) {
        $sql = "SELECT m.* FROM menus m
                JOIN restaurants r ON m.restaurant_id = r.id_restaurant
                WHERE m.restaurant_id = :rid AND r.proprietaire_id = :owner
                ORDER BY m.categorie, m.titre";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':rid' => $restaurantId, ':owner' => $proprietaireId]);
        return $stmt->fetchAll();
    }

    public function addMenu($restaurantId, $proprietaireId, $data) {
        // Vérifier que le restaurant appartient au restaurateur
        $check = $this->db->prepare("SELECT 1 FROM restaurants WHERE id_restaurant = :rid AND proprietaire_id = :owner");
        $check->execute([':rid' => $restaurantId, ':owner' => $proprietaireId]);
        if (!$check->fetch()) return false;

        $sql = "INSERT INTO menus (restaurant_id, titre, description, prix, disponible, categorie, image_url)
                VALUES (:rid, :titre, :desc, :prix, TRUE, :cat, :img)";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            ':rid'   => $restaurantId,
            ':titre' => $data['titre'],
            ':desc'  => $data['description'] ?? null,
            ':prix'  => intval($data['prix']),
            ':cat'   => $data['categorie'] ?? 'Plat',
            ':img'   => $data['image_url'] ?? null,
        ]);
    }

    public function updateMenu($menuId, $proprietaireId, $data) {
        $sql = "UPDATE menus m SET titre = :titre, description = :desc, prix = :prix,
                        categorie = :cat, disponible = :dispo
                FROM restaurants r
                WHERE m.id_menu = :mid AND m.restaurant_id = r.id_restaurant
                      AND r.proprietaire_id = :owner";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            ':titre' => $data['titre'],
            ':desc'  => $data['description'] ?? null,
            ':prix'  => intval($data['prix']),
            ':cat'   => $data['categorie'] ?? 'Plat',
            ':dispo' => isset($data['disponible']) ? ($data['disponible'] ? 't' : 'f') : 't',
            ':mid'   => $menuId,
            ':owner' => $proprietaireId,
        ]);
    }

    public function deleteMenu($menuId, $proprietaireId) {
        $sql = "DELETE FROM menus m USING restaurants r
                WHERE m.id_menu = :mid AND m.restaurant_id = r.id_restaurant
                      AND r.proprietaire_id = :owner";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([':mid' => $menuId, ':owner' => $proprietaireId]);
    }

    // ---- Avis ----
    public function getAvisByOwner($restaurateurId) {
        $sql = "SELECT a.*, r.nom as nom_restaurant,
                       CASE WHEN a.est_anonyme THEN a.nom_anonyme ELSE u.nom || ' ' || u.prenom END as auteur
                FROM avis a
                JOIN restaurants r ON a.restaurant_id = r.id_restaurant
                LEFT JOIN utilisateurs u ON a.utilisateur_id = u.id_utilisateur
                WHERE r.proprietaire_id = :user_id
                ORDER BY a.date_publication DESC";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':user_id' => $restaurateurId]);
        return $stmt->fetchAll();
    }

    public function repondreAvis($avisId, $restaurateurId, $reponse) {
        // Vérifie que l'avis appartient bien à un restaurant du restaurateur
        $check = $this->db->prepare(
            "SELECT 1 FROM avis a JOIN restaurants r ON a.restaurant_id = r.id_restaurant
             WHERE a.id_avis = :aid AND r.proprietaire_id = :owner"
        );
        $check->execute([':aid' => $avisId, ':owner' => $restaurateurId]);
        if (!$check->fetch()) return false;

        // Stocker la réponse dans un champ dédié (à ajouter si manquant)
        $sql = "UPDATE avis SET reponse_restaurateur = :rep WHERE id_avis = :aid";
        $stmt = $this->db->prepare($sql);
        return $stmt->execute([':rep' => $reponse, ':aid' => $avisId]);
    }
}

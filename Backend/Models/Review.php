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
        $estAnonyme = empty($data['utilisateur_id']);

        $sql = "INSERT INTO avis
                    (restaurant_id, utilisateur_id, note, commentaire, est_anonyme, nom_anonyme, adresse_ip, statut_moderation)
                VALUES
                    (:restaurant_id, :utilisateur_id, :note, :commentaire, :est_anonyme, :nom_anonyme, :adresse_ip, 'approuve')";

        $stmt = $this->db->prepare($sql);
        return $stmt->execute([
            ':restaurant_id'  => $data['restaurant_id'],
            ':utilisateur_id' => $estAnonyme ? null : $data['utilisateur_id'],
            ':note'           => $data['note'],
            ':commentaire'    => $data['commentaire'] ?? null,
            ':est_anonyme'    => $estAnonyme ? 't' : 'f',
            ':nom_anonyme'    => $estAnonyme ? ($data['nom_anonyme'] ?? 'Visiteur Anonyme') : null,
            ':adresse_ip'     => $data['adresse_ip'] ?? null,
        ]);
    }

    /** Modifie un avis — uniquement si l'auteur correspond (sécurité).
     * Les avis anonymes (utilisateur_id NULL) ne sont pas modifiables via cette méthode.
     */
    public function updateReview($idAvis, $utilisateurId, $note, $commentaire) {
        if ($utilisateurId <= 0) {
            return false;
        }

        $sql = "UPDATE avis
                SET note = :note, commentaire = :commentaire
                WHERE id_avis = :id_avis AND utilisateur_id = :utilisateur_id";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':note'           => $note,
            ':commentaire'    => $commentaire,
            ':id_avis'        => $idAvis,
            ':utilisateur_id' => $utilisateurId,
        ]);

        return $stmt->rowCount() > 0;
    }
}

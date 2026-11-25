<?php

require_once __DIR__ . '/../Services/CacheService.php';

use App\Services\CacheService;

class Restaurant {
    private $db;
    private CacheService $cache;

    public function __construct($dbConnection) {
        $this->db = $dbConnection;
        $this->cache = new CacheService();
    }

    public function getAllVerified($workspaceId = null, $searchQuery = null) {
        $useCache = ($searchQuery === null || $searchQuery === '');
        $cacheKey = $workspaceId ? "restaurants:workspace:{$workspaceId}" : 'restaurants:all';

        if ($useCache) {
            $cached = $this->cache->get($cacheKey);
            if (is_array($cached)) {
                return $cached;
            }
        }

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
        $results = $stmt->fetchAll();

        if ($useCache) {
            $this->cache->set($cacheKey, $results, 300);
        }

        return $results;
    }

    public function getQuartiers() {
        $sql = "SELECT id_workspace, nom_quartier FROM workspaces ORDER BY nom_quartier ASC";
        return $this->db->query($sql)->fetchAll();
    }

    public function getById($id) {
        $sql = "SELECT r.*, w.nom_quartier FROM restaurants r 
                LEFT JOIN workspaces w ON r.workspace_id = w.id_workspace 
                WHERE r.id_restaurant = :id AND r.est_valide = TRUE";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id]);
        return $stmt->fetch();
    }

    /**
     * Création atomique d'un établissement, de son premier plat au menu et de sa photo principale.
     * Garantit l'intégrité multi-tables via transaction SQL (commit / rollBack) et invalide le cache clé-valeur.
     */
    public function createWithInitialMenuAndMedia(array $restaurantData, array $menuData, ?array $mediaData = null): int {
        try {
            $this->db->beginTransaction();

            $stmtResto = $this->db->prepare(
                'INSERT INTO restaurants (
                    workspace_id, proprietaire_id, nom, adresse, telephone, email,
                    description, latitude, longitude, statut_ouverture, type_restaurant, gamme_prix, est_valide
                 ) VALUES (
                    :workspace_id, :proprietaire_id, :nom, :adresse, :telephone, :email,
                    :description, :latitude, :longitude, :statut_ouverture, :type_restaurant, :gamme_prix, FALSE
                 ) RETURNING id_restaurant'
            );

            $stmtResto->execute([
                ':workspace_id'     => $restaurantData['workspace_id'],
                ':proprietaire_id'  => $restaurantData['proprietaire_id'],
                ':nom'              => $restaurantData['nom'],
                ':adresse'          => $restaurantData['adresse'],
                ':telephone'        => $restaurantData['telephone'] ?? null,
                ':email'            => $restaurantData['email'] ?? null,
                ':description'      => $restaurantData['description'] ?? null,
                ':latitude'         => $restaurantData['latitude'] ?? null,
                ':longitude'        => $restaurantData['longitude'] ?? null,
                ':statut_ouverture' => $restaurantData['statut_ouverture'] ?? 'Fermé',
                ':type_restaurant'  => $restaurantData['type_restaurant'] ?? null,
                ':gamme_prix'       => $restaurantData['gamme_prix'] ?? 'Classique',
            ]);

            $restaurantId = (int)$stmtResto->fetchColumn();

            $stmtMenu = $this->db->prepare(
                'INSERT INTO menus (restaurant_id, titre, description, prix, disponible, categorie)
                 VALUES (:restaurant_id, :titre, :description, :prix, TRUE, :categorie)'
            );
            $stmtMenu->execute([
                ':restaurant_id' => $restaurantId,
                ':titre'         => $menuData['titre'],
                ':description'   => $menuData['description'] ?? null,
                ':prix'          => (int)$menuData['prix'],
                ':categorie'     => $menuData['categorie'] ?? 'Plat',
            ]);

            if ($mediaData !== null) {
                $stmtMedia = $this->db->prepare(
                    'INSERT INTO medias (restaurant_id, nom_fichier, type_mime, taille, chemin_fichier)
                     VALUES (:restaurant_id, :nom_fichier, :type_mime, :taille, :chemin_fichier)'
                );
                $stmtMedia->execute([
                    ':restaurant_id'  => $restaurantId,
                    ':nom_fichier'    => $mediaData['nom_fichier'],
                    ':type_mime'      => $mediaData['type_mime'],
                    ':taille'         => $mediaData['taille'],
                    ':chemin_fichier' => $mediaData['chemin_fichier'],
                ]);
            }

            $this->db->commit();

            $this->cache->delete('restaurants:workspace:' . (int)$restaurantData['workspace_id']);
            $this->cache->delete('restaurants:all');

            return $restaurantId;
        } catch (\Throwable $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            throw $e;
        }
    }
}
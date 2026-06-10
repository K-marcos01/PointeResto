/* POINTERESTO  API (Frontend)
 * Rôle : Gérer exclusivement les appels HTTP vers les endpoints PHP. 
*/

const BASE_URL = '/PointeResto/Backend/API'; // URL de base pour les appels API

/** Récupère la liste des quartiers (Workspaces) depuis PostgreSQL
     @returns {Promise<Array>} 
 */
async function chargerQuartiersDepuisAPI() {
    try {
        const reponse = await fetch(`${BASE_URL}/get_workspaces.php`);
        if (!reponse.ok) {
            throw new Error(`Erreur serveur : ${reponse.status}`);
        }
        return await reponse.json();
    } catch (erreur) {
        console.error("Erreur lors du chargement des quartiers :", erreur);
        return [];
    }
}

/** Récupère la liste des restaurants (avec option de filtrage)
 * @param {string} idQuartier 
 * @returns {Promise<Array>}
 */
async function chargerRestaurantsDepuisAPI(idQuartier = '') {
    try {
        let url = `${BASE_URL}/get_restaurants.php`;
        if (idQuartier) {
            url += `?workspace_id=${idQuartier}`;
        }
        const reponse = await fetch(url);
        if (!reponse.ok) {
            throw new Error(`Erreur serveur : ${reponse.status}`);
        }
        return await reponse.json();
    } catch (erreur) {
        console.error("Erreur lors du chargement des restaurants :", erreur);
        return [];
    }
}
/* POINTERESTO  (Application Orchestrateur)
 * Rôle : Initialiser la page d'accueil et écouter les actions de l'utilisateur.
 */

// Attendre que tout le DOM soit complètement chargé par le navigateur
document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Initialisation des composants de filtres (Quartiers)
    const selectQuartier = document.getElementById('workspace-select');
    const quartiers = await chargerQuartiersDepuisAPI();
    
    // Remplissage dynamique de la liste déroulante <select>
    quartiers.forEach(zone => {
        const option = document.createElement('option');
        option.value = zone.id_workspace;
        option.textContent = zone.nom_quartier;
        selectQuartier.appendChild(option);
    });

    // 2. Premier chargement : Affichage de tous les restaurants de Pointe-Noire
    const tousLesRestaurants = await chargerRestaurantsDepuisAPI();
    afficherRestaurants(tousLesRestaurants);

    // 3. Écouteur d'événement : Recharger les restaurants lorsque l'utilisateur change de quartier
    selectQuartier.addEventListener('change', async (evenement) => {
        const idQuartierSelectionne = evenement.target.value;
        
        // Affichage d'un message temporaire pendant le traitement de la requête
        const conteneur = document.getElementById('restaurants-container');
        conteneur.innerHTML = `<p class="no-data">Recherche en cours...</p>`;
        
        // Appel API avec le filtre et mise à jour de la vue
        const restaurantsFiltres = await chargerRestaurantsDepuisAPI(idQuartierSelectionne);
        afficherRestaurants(restaurantsFiltres);
    });
});
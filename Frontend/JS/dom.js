/* POINTERESTO  DOM (Frontend)
 * Rôle : Manipulation de l'affichage HTML uniquement via des classes CSS.
 */

/**
 * Associe une classe CSS (code couleur) au statut d'ouverture
 * @param {string} statut 
 * @returns {string} 
 */
function obtenirClasseStatut(statut) {
    switch (statut?.toLowerCase()) {
        case 'ouvert': 
            return 'status-green';   
        case 'ferme bientot': 
            return 'status-orange';  
        default: 
            return 'status-red';     
    }
}

/** Génère le code HTML pour la carte d'un restaurant
 * @param {Object} resto
 * @returns {string} 
 */
function genererCarteRestaurant(resto) {
    const classeStatut = obtenirClasseStatut(resto.statut_ouverture);
    
    return `
        <div class="restaurant-card">
            <div class="card-header">
                <h3>${resto.nom}</h3>
                <span class="badge ${classeStatut}">${resto.statut_ouverture || 'Fermé'}</span>
            </div>
            <p class="adresse"> ${resto.adresse}</p>
            <div class="card-footer">
                <span class="type text-blue">${resto.type_restaurant}</span>
                <span class="note text-gold"> ${resto.note_moyenne || 'N/A'}/5</span>
            </div>
        </div>
    `;
}

/** Injecte la liste des restaurants dans l'interface mobile
 * @param {Array} listeRestaurants 
 */
function afficherRestaurants(listeRestaurants) {
    const conteneur = document.getElementById('restaurants-container');
    if (!conteneur) return;

    if (listeRestaurants.length === 0) {
        conteneur.innerHTML = `<p class="no-data">Aucun établissement trouvé dans cette zone.</p>`;
        return;
    }

    conteneur.innerHTML = listeRestaurants.map(resto => genererCarteRestaurant(resto)).join('');
}
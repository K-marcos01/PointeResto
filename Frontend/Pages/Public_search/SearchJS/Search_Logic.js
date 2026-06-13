/*POINTERESTO - Logique de l'interface de recherche  */
document.addEventListener('DOMContentLoaded', () => {
    const wrapper = document.getElementById('wrapper-restaurants');
    
    // Simulation locale des données PostgreSQL pour valider le comportement visuel
    const maquetteRestaurants = [
        { nom: "La Marmite Africaine", adresse: "Avenue de l'Indépendance", type: "Traditionnel", statut: "open", texteStatut: "Ouvert" },
        { nom: "Le Fast Food du Coin", adresse: "Rue des Écoles, Lumumba", type: "Fast-food", statut: "closed", texteStatut: "Fermé" }
    ];

    function injecterCartes(liste) {
        if(liste.length === 0) {
            wrapper.innerHTML = '<p class="status-message">Aucun établissement trouvé.</p>';
            return;
        }

        wrapper.innerHTML = liste.map(resto => `
            <article class="restaurant-card">
                <div class="card-header">
                    <h3>${resto.nom}</h3>
                </div>
                <p class="restaurant-address"> ${resto.adresse}</p>
                <div class="card-meta">
                    <span class="status-badge ${resto.statut}">${resto.texteStatut}</span>
                    <span class="food-type">${resto.type}</span>
                </div>
            </article>
        `).join('');
    }

    // Initialisation
    setTimeout(() => injecterCartes(maquetteRestaurants), 400);
});
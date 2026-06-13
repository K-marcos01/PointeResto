/* POINTERESTO - Logique de communication API REST */
document.addEventListener('DOMContentLoaded', () => {
    const selectQuartier = document.getElementById('select-quartier');
    const inputRecherche = document.getElementById('input-recherche');
    const wrapper = document.getElementById('wrapper-restaurants');

    // URL de base de votre serveur local 
    const API_BASE = '/Backend/API';

    // 1. Charger les quartiers dans le menu déroulant
    async function chargerQuartiers() {
        try {
            const reponse = await fetch(`${API_BASE}/get_workspaces.php`);
            if (!reponse.ok) throw new Error(`Erreur serveur : ${reponse.status}`);
            const donnees = await reponse.json();
            
            selectQuartier.innerHTML = '<option value="">Tous les quartiers de Pointe-Noire</option>' + 
                donnees.map(q => `<option value="${q.id_workspace}">${q.nom_quartier}</option>`).join('');
        } catch (error) {
            console.error("Erreur lors du chargement des quartiers :", error);
        }
    }

    // 2. Charger et filtrer les restaurants depuis PostgreSQL
    async function chargerRestaurants() {
        const qId = selectQuartier.value;
        const recherche = encodeURIComponent(inputRecherche.value);
        wrapper.innerHTML = '<p class="status-message">Recherche des établissements en cours...</p>';

        try {
            const url = `${API_BASE}/get_restaurants.php?workspace_id=${qId}&q=${recherche}`;
            const reponse = await fetch(url);
            if (!reponse.ok) throw new Error(`Erreur serveur : ${reponse.status}`);
            const restaurants = await reponse.json();

            if (restaurants.length === 0) {
                wrapper.innerHTML = '<p class="status-message">Aucun établissement trouvé dans cette zone.</p>';
                return;
            }

            wrapper.innerHTML = restaurants.map(resto => `
                <article class="restaurant-card">
                    <div class="card-header">
                        <h3>${resto.nom}</h3>
                    </div>
                    <p class="restaurant-address"> ${resto.adresse} (${resto.nom_quartier})</p>
                    <div class="card-meta">
                        <span class="status-badge ${resto.statut_ouverture === 'Ouvert' ? 'open' : 'closed'}">
                            ${resto.statut_ouverture || 'Non spécifié'}
                        </span>
                        <span class="food-type">${resto.type_restaurant}</span>
                    </div>
                </article>
            `).join('');
        } catch (error) {
            wrapper.innerHTML = '<p class="status-message">Erreur de communication avec le serveur.</p>';
            console.error("Erreur lors du chargement des restaurants :", error);
        }
    }

    // Écouteurs d'événements (Event Listeners)
    selectQuartier.addEventListener('change', chargerRestaurants);
    inputRecherche.addEventListener('input', chargerRestaurants); // Filtrage en temps réel à la saisie

    // Initialisation au chargement de l'écran
    chargerQuartiers();
    chargerRestaurants();
});
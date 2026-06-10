/*POINTERESTO - Module Filtres & Recherche
 * Rôle : Capturer la saisie utilisateur et interroger l'API de recherche.
 */

let delaiRecherche;

/* Initialise le moteur de recherche en écoutant le champ de texte */
function initialiserRechercheBarre() {
    const barreRecherche = document.getElementById('search-input');
    if (!barreRecherche) return;

    barreRecherche.addEventListener('input', (evenement) => {
        const texteRecherche = evenement.target.value.trim();

        // Annule le déclenchement précédent si l'utilisateur tape vite
        clearTimeout(delaiRecherche);

        // Attend 400ms d'inactivité avant de lancer la requête (optimisation mobile)
        delaiRecherche = setTimeout(async () => {
            const conteneur = document.getElementById('restaurants-container');
            
            if (texteRecherche.length < 2) {
                // Si le champ est vide ou trop court, on réaffiche tout
                const tousLesRestos = await chargerRestaurantsDepuisAPI();
                afficherRestaurants(tousLesRestos);
                return;
            }

            conteneur.innerHTML = `<p class="no-data">Recherche de "${texteRecherche}"...</p>`;
            
            try {
                const reponse = await fetch(`/pointeresto/backend/api/search_restaurants.php?q=${encodeURIComponent(texteRecherche)}`);
                if (reponse.ok) {
                    const restosTrouves = await reponse.json();
                    afficherRestaurants(restosTrouves);
                }
            } catch (erreur) {
                console.error("Erreur recherche :", erreur);
            }
        }, 400);
    });
}

// Lancement automatique du script
document.addEventListener('DOMContentLoaded', initialiserRechercheBarre);
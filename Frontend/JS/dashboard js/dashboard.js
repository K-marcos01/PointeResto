/* POINTERESTO - Module Dashboard (Frontend)
 * Rôle : Gérer l'affichage des données du restaurant et la mise à jour du statut.
 */

// Simulation d'un identifiant de restaurant connecté (Ex: Le Comptoir de la Plage)
const RESTAURANT_CONNECTE_ID = 1; 

document.addEventListener('DOMContentLoaded', async () => {
    const badgeStatut = document.getElementById('badge-statut-actuel');
    const msgRetour = document.getElementById('msg-retour');

    // 1. Chargement initial des données de l'établissement depuis l'API
    try {
        const reponse = await fetch(`/pointeresto/backend/api/get_restaurants.php`);
        if (reponse.ok) {
            const restaurants = await reponse.json();
            // Recherche de notre restaurant spécifique dans la liste
            const monResto = restaurants.find(r => parseInt(r.id_restaurant) === RESTAURANT_CONNECTE_ID);
            
            if (monResto) {
                document.getElementById('resto-nom').textContent = monResto.nom;
                document.getElementById('resto-adresse').textContent = `📍 ${monResto.adresse}`;
                badgeStatut.textContent = monResto.statut_ouverture || 'Fermé';
                badgeStatut.className = `badge status-${monResto.statut_ouverture === 'Ouvert' ? 'green' : (monResto.statut_ouverture === 'Ferme bientot' ? 'orange' : 'red')}`;
            }
        }
    } catch (erreur) {
        console.error("Erreur d'initialisation du dashboard :", erreur);
    }

    // 2. Traitement de la modification du statut d'ouverture
    document.getElementById('form-statut').addEventListener('submit', async (evenement) => {
        evenement.preventDefault();
        const nouveauStatut = document.getElementById('select-statut').value;

        try {
            const reponse = await fetch('/pointeresto/backend/api/update_statut.php', {
                method: 'POST',
                headers: { 'Content-Type: application/json' },
                body: JSON.stringify({ 
                    id_restaurant: RESTAURANT_CONNECTE_ID, 
                    statut: nouveauStatut 
                })
            });

            if (reponse.ok) {
                badgeStatut.textContent = nouveauStatut;
                badgeStatut.className = `badge status-${nouveauStatut === 'Ouvert' ? 'green' : (nouveauStatut === 'Ferme bientot' ? 'orange' : 'red')}`;
                msgRetour.textContent = " Le statut a été mis à jour avec succès !";
                msgRetour.style.color = "#15803d";
                msgRetour.style.display = "block";
            }
        } catch (erreur) {
            console.error("Erreur lors de la mise à jour :", erreur);
        }
    });
});
/* POINTERESTO - Logique Métier de l'Espace Privé */
document.addEventListener('DOMContentLoaded', () => {
    const formConnexion  = document.getElementById('form-connexion');
    const formStatut     = document.getElementById('form-update-status');
    const btnDeconnexion = document.getElementById('btn-deconnexion');

    // Simulation d'identifiants valides (en attendant le couplage PHP Session)
    const SIMULATION_EMAIL = "gerant@marmite.cg";
    const SIMULATION_PASS  = "marmite242";

    // --- LOGIQUE DE L'ÉCRAN DE CONNEXION ---
    if (formConnexion) {
        formConnexion.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('input-email').value;
            const pass = document.getElementById('input-password').value;
            const errorBox = document.getElementById('error-message');

            // Le formulaire ne demande pas le rôle, c'est le système qui le valide en tâche de fond
            if (email === SIMULATION_EMAIL && pass === SIMULATION_PASS) {
                // Sauvegarde de l'état de session fictive
                localStorage.setItem('pointeresto_session_resto', '1'); 
                window.location.href = "Dashboard.html";
            } else {
                errorBox.textContent = "Identifiants invalides. Vérifiez vos accès.";
                errorBox.style.display = "block";
            }
        });
    }

    // --- LOGIQUE DU TABLEAU DE BORD DE GESTION ---
    if (formStatut) {
        const badgeElement = document.getElementById('current-status-badge');
        const selectElement = document.getElementById('select-status');
        const successBox = document.getElementById('success-message');

        // Initialisation de l'affichage du restaurant connecté
        function initialiserDashboard() {
            document.getElementById('restaurant-name').textContent = "La Marmite Africaine";
            document.getElementById('restaurant-zone').textContent = "Avenue de l'Indépendance";
            
            // État par défaut de la maquette
            badgeElement.textContent = "OUVERT";
            badgeElement.className = "badge open";
            selectElement.value = "Ouvert";
        }

        formStatut.addEventListener('submit', (e) => {
            e.preventDefault();
            const nouvelEtat = selectElement.value;
            
            // Mise à jour visuelle du badge réglementaire
            badgeElement.textContent = nouvelEtat.toUpperCase();
            if (nouvelEtat === "Ouvert") badgeElement.className = "badge open";
            if (nouvelEtat === "Ferme bientot") badgeElement.className = "badge warning";
            if (nouvelEtat === "Fermé") badgeElement.className = "badge closed";

            successBox.textContent = "Modification enregistrée avec succès.";
            successBox.style.display = "block";
            setTimeout(() => successBox.style.display = "none", 3000);
        });

        if (btnDeconnexion) {
            btnDeconnexion.addEventListener('click', () => {
                localStorage.removeItem('pointeresto_session_resto');
                window.location.href = "Login.html";
            });
        }

        initialiserDashboard();
    }
});
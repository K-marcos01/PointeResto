document.addEventListener('DOMContentLoaded', () => {
    const user = Auth.checkAccess();
    if (user) {
        loadDashboardStats(user.id_utilisateur);
    }
});

async function loadDashboardStats(userId) {
    try {
        const stats = await API.get('dashboard', { user_id: userId });
        document.getElementById('stat-restos').textContent = stats.total_restos;
        document.getElementById('stat-rating').textContent = parseFloat(stats.note_globale).toFixed(1) + ' / 5';
        document.getElementById('stat-avis').textContent = stats.total_avis;
    } catch (e) {
        console.error("Erreur de chargement des statistiques", e);
    }
}

async function changeStatus(statusName, restaurantId) {
    try {
        const response = await API.post('dashboard', {
            restaurant_id: restaurantId,
            statut: statusName
        });
        if (response.success) {
            alert('Le statut de l\'établissement a été mis à jour avec succès.');
        }
    } catch (e) {
        alert('Erreur lors de la mise à jour.');
    }
}
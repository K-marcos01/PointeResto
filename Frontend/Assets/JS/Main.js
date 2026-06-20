let showOnlyFavs = false;

document.addEventListener('DOMContentLoaded', () => {
    Auth.initClientSession();
    refreshFavCount();
    initFilters();
    loadRestaurants();
    document.getElementById('search-input').addEventListener('input', debounce(loadRestaurants, 300));
    document.getElementById('quartier-select').addEventListener('change', loadRestaurants);
    document.getElementById('btn-toggle-favs').addEventListener('click', toggleFavsFilter);
});

function getFavs() {
    return JSON.parse(localStorage.getItem('pointeresto_favs') || '[]');
}

function refreshFavCount() {
    document.getElementById('fav-count').textContent = getFavs().length;
}

async function loadRestaurants() {
    const search = document.getElementById('search-input').value;
    const workspace = document.getElementById('quartier-select').value;
    const container = document.getElementById('restaurants-container');

    let list;
    try {
        list = await API.get('restaurants', { action: 'list', search, workspace });
    } catch (e) {
        container.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:var(--gray); padding:2rem;">
            Impossible de charger les restaurants. Vérifiez votre connexion.
        </p>`;
        return;
    }

    const favs = getFavs();
    if (showOnlyFavs) {
        list = list.filter(r => favs.includes(r.id_restaurant));
    }

    if (!list.length) {
        container.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:var(--gray); padding:2rem;">
            ${showOnlyFavs ? 'Aucun favori pour le moment.' : 'Aucun restaurant trouvé.'}
        </p>`;
        return;
    }

    const statusClass = (statut) => {
        if (statut === 'Ouvert') return 'status-ouvert';
        if (statut === 'Ferme bientot') return 'status-ferme-bientot';
        return 'status-fermé';
    };

    container.innerHTML = list.map(r => `
        <article class="restaurant-card" onclick="goToDetail(${r.id_restaurant})">
            <img src="${getRestaurantImage(r.type_restaurant)}" class="card-img-top" alt="${r.nom}">
            <span class="card-status-badge ${statusClass(r.statut_ouverture)}">${r.statut_ouverture}</span>
            <button class="btn-fav-card" onclick="toggleFav(${r.id_restaurant}, event)">
                ${favs.includes(r.id_restaurant) ? '❤️' : '🤍'}
            </button>
            <div class="card-body">
                <h2 class="card-title">${r.nom}</h2>
                <p class="card-address">${r.nom_quartier || 'Pointe-Noire'} — ${r.adresse}</p>
                <div class="card-footer-meta">
                    <span>${r.type_restaurant || ''}</span>
                    <span class="card-rating">★ ${Number(r.note_moyenne || 0).toFixed(1)}</span>
                </div>
            </div>
        </article>
    `).join('');
}

function getRestaurantImage(type) {
    const t = String(type || '').toLowerCase();
    if (t.includes('maquis'))        return 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&q=80';
    if (t.includes('fruits de mer')) return 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=500&q=80';
    if (t.includes('fast'))          return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80';
    if (t.includes('pizz'))          return 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&q=80';
    if (t.includes('grillade'))      return 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=500&q=80';
    if (t.includes('boulanger'))     return 'https://images.unsplash.com/photo-1549931319-a545749fcd09?w=500&q=80';
    return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&q=80';
}

function goToDetail(id) {
    window.location.href = `Detail.html?id=${id}`;
}

function toggleFav(id, event) {
    event.stopPropagation();
    let favs = getFavs();
    const isFav = favs.includes(id);
    favs = isFav ? favs.filter(fid => fid !== id) : [...favs, id];
    localStorage.setItem('pointeresto_favs', JSON.stringify(favs));
    refreshFavCount();
    Toast.success(isFav ? 'Retiré des favoris' : 'Ajouté aux favoris');
    loadRestaurants();
}

function toggleFavsFilter() {
    showOnlyFavs = !showOnlyFavs;
    loadRestaurants();
}

function initFilters() {
    API.get('restaurants', { action: 'quartiers' })
       .then(qs => qs.forEach(q => {
            const opt = document.createElement('option');
            opt.value = q.id_workspace;
            opt.textContent = q.nom_quartier;
            document.getElementById('quartier-select').appendChild(opt);
       }))
       .catch(() => {});
}

function debounce(fn, d) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), d);
    };
}

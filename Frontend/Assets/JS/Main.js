let showOnlyFavs = false;
const FAVORITES_KEY = 'pointeresto_favorites';

document.addEventListener('DOMContentLoaded', () => {
    Auth.initClientSession();
    migrateLegacyFavorites();
    refreshFavCount();
    initFilters();
    loadRestaurants();
    document.getElementById('search-input').addEventListener('input', debounce(loadRestaurants, 300));
    document.getElementById('quartier-select').addEventListener('change', loadRestaurants);
    document.getElementById('btn-toggle-favs').addEventListener('click', toggleFavsFilter);
});

function migrateLegacyFavorites() {
    const legacy = localStorage.getItem('pointeresto_favs');
    if (legacy && !localStorage.getItem(FAVORITES_KEY)) {
        localStorage.setItem(FAVORITES_KEY, legacy);
    }
}

function getFavs() {
    try {
        return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
    } catch (e) {
        return [];
    }
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
        container.innerHTML = `<p class="grid-empty-msg">
            Impossible de charger les restaurants. Vérifiez votre connexion.
        </p>`;
        return;
    }

    const favs = getFavs();
    if (showOnlyFavs) {
        list = list.filter(r => favs.includes(r.id_restaurant));
    } else {
        // Épingler les établissements favoris en haut de la liste (TC-02)
        list = [...list].sort((a, b) => {
            const aFav = favs.includes(a.id_restaurant) ? 1 : 0;
            const bFav = favs.includes(b.id_restaurant) ? 1 : 0;
            return bFav - aFav;
        });
    }

    if (!list.length) {
        container.innerHTML = `<p class="grid-empty-msg">
            ${showOnlyFavs ? 'Aucun favori pour le moment.' : 'Aucun restaurant trouvé.'}
        </p>`;
        return;
    }

    const statusClass = (statut) => {
        if (statut === 'Ouvert') return 'status-ouvert';
        if (statut === 'Ferme bientot') return 'status-ferme-bientot';
        return 'status-ferme status-fermé';
    };

    container.innerHTML = list.map(r => {
        const id = Number(r.id_restaurant);
        const nom = escapeHtml(r.nom);
        const quartier = escapeHtml(r.nom_quartier || 'Pointe-Noire');
        const adresse = escapeHtml(r.adresse);
        const type = escapeHtml(r.type_restaurant || '');
        const statut = escapeHtml(r.statut_ouverture);
        const note = Number(r.note_moyenne || 0).toFixed(1);

        return `
            <article class="restaurant-card" onclick="goToDetail(${id})">
                <img src="${getRestaurantImage(r.type_restaurant)}" class="card-img-top" alt="${nom}">
                <span class="card-status-badge ${statusClass(r.statut_ouverture)}">${statut}</span>
                <button class="btn-fav-card" onclick="toggleFav(${id}, event)" aria-label="Favori">
                    ${favs.includes(id) ? '❤️' : '🤍'}
                </button>
                <div class="card-body">
                    <h2 class="card-title">${nom}</h2>
                    <p class="card-address">${quartier} — ${adresse}</p>
                    <div class="card-footer-meta">
                        <span>${type}</span>
                        <span class="card-rating">★ ${note}</span>
                    </div>
                </div>
            </article>
        `;
    }).join('');
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
    window.location.href = `Detail.html?id=${encodeURIComponent(id)}`;
}

function toggleFav(id, event) {
    event.stopPropagation();
    let favs = getFavs();
    const isFav = favs.includes(id);
    favs = isFav ? favs.filter(fid => fid !== id) : [...favs, id];
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
    refreshFavCount();
    Toast.success(isFav ? 'Retiré des favoris' : 'Ajouté aux favoris');
    loadRestaurants();
}

function toggleFavsFilter() {
    showOnlyFavs = !showOnlyFavs;
    const btn = document.getElementById('btn-toggle-favs');
    if (btn) {
        btn.classList.toggle('active', showOnlyFavs);
    }
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
let showOnlyFavs = false;
let activeQuickFilter = 'all';
const FAVORITES_KEY = 'pointeresto_favorites';

document.addEventListener('DOMContentLoaded', () => {
    Auth.initClientSession();
    renderNavbarAuth();
    migrateLegacyFavorites();
    refreshFavCount();
    initFilters();
    initQuickFilterChips();
    loadRestaurants();

    document.getElementById('search-input').addEventListener('input', debounce(loadRestaurants, 300));
    document.getElementById('quartier-select').addEventListener('change', loadRestaurants);
    document.getElementById('btn-toggle-favs').addEventListener('click', toggleFavsFilter);
});

function renderNavbarAuth() {
    const slot = document.getElementById('nav-auth-slot');
    if (!slot) return;

    const user = Auth.getUser();
    const token = Auth.getToken();

    if (token && user && user.id_utilisateur !== 0) {
        if (user.role === 'restaurateur' || user.role === 'moderateur') {
            slot.innerHTML = `
                <span class="nav-user-pill">
                    <a href="Dashboard.html" class="btn-navbar-link">📊 Espace Pro</a>
                    <button type="button" class="nav-logout-btn" id="btn-nav-logout">Quitter</button>
                </span>
            `;
        } else {
            const prenom = escapeHtml(user.prenom || user.nom || 'Mon compte');
            slot.innerHTML = `
                <span class="nav-user-pill">
                    <span class="btn-navbar-link">👤 ${prenom}</span>
                    <button type="button" class="nav-logout-btn" id="btn-nav-logout">Quitter</button>
                </span>
            `;
        }
        const logoutBtn = document.getElementById('btn-nav-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => Auth.logout('Index.html'));
        }
    }
}

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

function initQuickFilterChips() {
    const chips = document.querySelectorAll('#quick-filters .filter-chip');
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            chips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            activeQuickFilter = chip.dataset.filter || 'all';
            loadRestaurants();
        });
    });
}

function resolveRestaurantPhoto(restaurant) {
    const raw = String(restaurant.photo_principale || '').trim();
    if (/^https?:\/\//i.test(raw)) {
        return raw;
    }
    if (raw.startsWith('uploads/')) {
        const filename = raw.replace(/^uploads\//, '');
        const baseUploads = API_BASE.replace(/Index\.php$/i, 'Uploads.php');
        return `${baseUploads}?file=${encodeURIComponent(filename)}`;
    }
    return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80';
}

async function loadRestaurants() {
    const search = document.getElementById('search-input').value;
    const workspace = document.getElementById('quartier-select').value;
    const container = document.getElementById('restaurants-container');
    const countLabel = document.getElementById('results-count');

    let list;
    try {
        list = await API.get('restaurants', { action: 'list', search, workspace });
    } catch (e) {
        if (countLabel) countLabel.textContent = 'Erreur de chargement';
        container.innerHTML = `<p class="grid-empty-msg">
            Impossible de charger les restaurants. Vérifiez votre connexion au serveur.
        </p>`;
        return;
    }

    if (activeQuickFilter === 'open') {
        list = list.filter(r => r.statut_ouverture === 'Ouvert');
    } else if (activeQuickFilter !== 'all') {
        list = list.filter(r => String(r.type_restaurant || '').toLowerCase() === activeQuickFilter.toLowerCase());
    }

    const favs = getFavs();
    if (showOnlyFavs) {
        list = list.filter(r => favs.includes(r.id_restaurant));
    } else {
        list = [...list].sort((a, b) => {
            const aFav = favs.includes(a.id_restaurant) ? 1 : 0;
            const bFav = favs.includes(b.id_restaurant) ? 1 : 0;
            return bFav - aFav;
        });
    }

    if (countLabel) {
        countLabel.textContent = `${list.length} établissement${list.length > 1 ? 's' : ''} à Pointe-Noire`;
    }

    if (!list.length) {
        container.innerHTML = `<p class="grid-empty-msg">
            ${showOnlyFavs ? 'Aucun favori enregistré pour le moment.' : 'Aucun restaurant ne correspond à ces critères.'}
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
        const type = escapeHtml(r.type_restaurant || 'Restaurant');
        const gamme = escapeHtml(r.gamme_prix || 'Classique');
        const desc = escapeHtml(r.description || 'Découvrez la carte et les avis de cet établissement à Pointe-Noire.');
        const statut = escapeHtml(r.statut_ouverture);
        const note = Number(r.note_moyenne || 0).toFixed(1);
        const photoUrl = escapeHtml(resolveRestaurantPhoto(r));

        return `
            <article class="restaurant-card" onclick="goToDetail(${id})">
                <div class="card-media-wrapper">
                    <img src="${photoUrl}" class="card-img-top" alt="${nom}" loading="lazy">
                    <span class="card-status-badge ${statusClass(r.statut_ouverture)}">${statut}</span>
                    <button type="button" class="btn-fav-card" onclick="toggleFav(${id}, event)" aria-label="Favori">
                        ${favs.includes(id) ? '❤️' : '🤍'}
                    </button>
                    <span class="card-quartier-tag">📍 ${quartier}</span>
                    <span class="card-rating-badge"><span class="card-rating-star">★</span> ${note}</span>
                </div>
                <div class="card-body">
                    <div class="card-title-row">
                        <h2 class="card-title">${nom}</h2>
                        <span class="card-price-badge">${gamme}</span>
                    </div>
                    <p class="card-address">${adresse}</p>
                    <p class="card-desc-excerpt">${desc}</p>
                    <div class="card-footer-meta">
                        <span class="card-type-pill">${type}</span>
                        <span class="card-cta-link">Voir la carte →</span>
                    </div>
                </div>
            </article>
        `;
    }).join('');
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
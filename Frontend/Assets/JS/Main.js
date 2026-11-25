let showOnlyFavs = false;
let activeQuickFilter = 'all';
const FAVORITES_KEY = 'pointeresto_favorites';

const DIVERSE_RESTO_GALLERY = [
    'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=800&q=80',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&q=80',
    'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=800&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80',
    'https://images.unsplash.com/photo-1535400255456-067e2bc1c0e2?w=800&q=80',
    'https://images.unsplash.com/photo-1604908554007-31be7e0d3c0a?w=800&q=80',
    'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=800&q=80',
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
    'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80',
    'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=800&q=80',
    'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800&q=80',
    'https://images.unsplash.com/photo-1593504049359-74330189a345?w=800&q=80',
    'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=800&q=80',
    'https://images.unsplash.com/photo-1432139509613-5c4255815697?w=800&q=80',
    'https://images.unsplash.com/photo-1549931319-a545749fcd09?w=800&q=80',
    'https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=800&q=80',
    'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800&q=80',
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80'
];

document.addEventListener('DOMContentLoaded', () => {
    // La page de connexion est le point d'entrée : rediriger si ni connecté ni en exploration invité
    if (!Auth.isAuthenticated() && !Auth.isGuestExploring()) {
        window.location.href = 'Connexion.html';
        return;
    }

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

    if (Auth.isAuthenticated()) {
        const user = Auth.getUser();
        const initials = escapeHtml(Auth.getUserInitials());
        const fullName = escapeHtml(`${user.prenom || ''} ${user.nom || ''}`.trim());
        const isPro = (user.role === 'restaurateur' || user.role === 'moderateur');

        slot.innerHTML = `
            <span class="nav-user-pill">
                ${isPro
                    ? `<a href="Dashboard.html" class="nav-avatar-initials" title="${fullName} — Espace Pro">${initials}</a>`
                    : `<span class="nav-avatar-initials" title="${fullName}">${initials}</span>`
                }
                <button type="button" class="nav-logout-btn" id="btn-nav-logout">Quitter</button>
            </span>
        `;
        const logoutBtn = document.getElementById('btn-nav-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => Auth.logout('Connexion.html'));
        }
    } else {
        // Bouton Connexion affiché uniquement en mode exploration invité
        slot.innerHTML = `<a href="Connexion.html" class="btn-navbar-link">Connexion</a>`;
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

function getDistinctFallbackPhoto(restaurantId) {
    const idx = Math.abs((Number(restaurantId) || 1) - 1) % DIVERSE_RESTO_GALLERY.length;
    return DIVERSE_RESTO_GALLERY[idx];
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
    return getDistinctFallbackPhoto(restaurant.id_restaurant);
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
        const fallbackUrl = escapeHtml(getDistinctFallbackPhoto(id + 3));

        return `
            <article class="restaurant-card" onclick="goToDetail(${id})">
                <div class="card-media-wrapper">
                    <img src="${photoUrl}" class="card-img-top" alt="${nom}" loading="lazy"
                         onerror="this.onerror=null;this.src='${fallbackUrl}';">
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
let CURRENT_RESTO = null;
let CURRENT_RESTO_ID = null;
let CURRENT_MENU_ITEMS = [];
let SELECTED_RATING = 5;
let EDITING_REVIEW_ID = null;
const FAVORITES_KEY = 'pointeresto_favorites';

const DIVERSE_RESTO_GALLERY = [
    'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=900&q=80',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900&q=80',
    'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=900&q=80',
    'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=900&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&q=80',
    'https://images.unsplash.com/photo-1535400255456-067e2bc1c0e2?w=900&q=80',
    'https://images.unsplash.com/photo-1604908554007-31be7e0d3c0a?w=900&q=80',
    'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=900&q=80',
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900&q=80',
    'https://images.unsplash.com/photo-1547592180-85f173990554?w=900&q=80',
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=900&q=80',
    'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=900&q=80',
    'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=900&q=80',
    'https://images.unsplash.com/photo-1593504049359-74330189a345?w=900&q=80',
    'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=900&q=80',
    'https://images.unsplash.com/photo-1432139509613-5c4255815697?w=900&q=80',
    'https://images.unsplash.com/photo-1549931319-a545749fcd09?w=900&q=80',
    'https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=900&q=80',
    'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=900&q=80',
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=900&q=80'
];

document.addEventListener('DOMContentLoaded', async () => {
    Auth.initClientSession();

    const params = new URLSearchParams(window.location.search);
    CURRENT_RESTO_ID = parseInt(params.get('id'), 10);

    if (!CURRENT_RESTO_ID) {
        document.getElementById('detail-root').innerHTML = emptyState('Restaurant introuvable.');
        return;
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeDishModal();
    });

    try {
        CURRENT_RESTO = await API.get('restaurants', { action: 'detail', id: CURRENT_RESTO_ID });
        render();
        loadMenu();
        loadReviews();
    } catch (e) {
        document.getElementById('detail-root').innerHTML = emptyState('Impossible de charger ce restaurant.');
    }
});

function emptyState(msg) {
    return `<p class="empty-state">${escapeHtml(msg)}</p>`;
}

function statusClass(statut) {
    if (statut === 'Ouvert') return 'status-ouvert';
    if (statut === 'Ferme bientot') return 'status-ferme-bientot';
    return 'status-ferme status-fermé';
}

function getDistinctFallbackPhoto(restaurantId) {
    const idx = Math.abs((Number(restaurantId) || 1) - 1) % DIVERSE_RESTO_GALLERY.length;
    return DIVERSE_RESTO_GALLERY[idx];
}

function resolveHeroImage(restaurant) {
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

function getFavs() {
    try {
        const raw = localStorage.getItem(FAVORITES_KEY) || localStorage.getItem('pointeresto_favs') || '[]';
        return JSON.parse(raw);
    } catch (e) {
        return [];
    }
}

function render() {
    const r = CURRENT_RESTO;
    const favs = getFavs();
    const isFav = favs.includes(r.id_restaurant);

    const nom = escapeHtml(r.nom);
    const quartier = escapeHtml(r.nom_quartier || 'Pointe-Noire');
    const statut = escapeHtml(r.statut_ouverture);
    const type = escapeHtml(r.type_restaurant || 'Restaurant');
    const gamme = escapeHtml(r.gamme_prix || 'Classique');
    const description = escapeHtml(r.description || '');
    const note = Number(r.note_moyenne || 0).toFixed(1);
    const heroImg = escapeHtml(resolveHeroImage(r));
    const fallbackHero = escapeHtml(getDistinctFallbackPhoto(r.id_restaurant + 3));

    document.title = `PointeResto — ${r.nom}`;

    document.getElementById('detail-root').innerHTML = `
        <div class="detail-hero">
            <img src="${heroImg}" alt="${nom}" onerror="this.onerror=null;this.src='${fallbackHero}';">
            <a href="Index.html" class="detail-back-btn" aria-label="Retour">←</a>
            <button type="button" class="detail-fav-btn" id="detail-fav-btn" aria-label="Favori">${isFav ? '❤️' : '🤍'}</button>
            <div class="detail-hero-text">
                <h1 class="detail-title">${nom}</h1>
                <p class="detail-subtitle">📍 ${quartier} — Pointe-Noire</p>
            </div>
        </div>

        <div class="detail-status-row">
            <span class="detail-pill ${statusClass(r.statut_ouverture)}">${statut}</span>
            <span class="detail-pill pill-type">${type}</span>
            <span class="detail-pill pill-price">${gamme}</span>
            <span class="detail-pill pill-rating">★ ${note}</span>
        </div>

        ${description ? `<p class="detail-description">${description}</p>` : ''}

        <div class="detail-tabs">
            <button type="button" class="detail-tab active" data-tab="menus" onclick="switchTab('menus')">🍽️ Menus</button>
            <button type="button" class="detail-tab" data-tab="avis" onclick="switchTab('avis')">⭐ Avis</button>
            <button type="button" class="detail-tab" data-tab="orienter" onclick="switchTab('orienter')">📍 S'orienter</button>
        </div>

        <div class="detail-panel active" id="panel-menus">
            <p class="empty-state">Chargement du menu…</p>
        </div>

        <div class="detail-panel" id="panel-avis">
            <p class="empty-state">Chargement des avis…</p>
        </div>

        <div class="detail-panel" id="panel-orienter">
            ${renderOrientPanel(r)}
        </div>

        <div id="dish-modal" class="dish-modal-backdrop hidden" role="dialog" aria-modal="true" aria-labelledby="dish-modal-title">
            <div class="dish-modal-card">
                <button type="button" class="dish-modal-close" id="dish-modal-close" aria-label="Fermer">×</button>
                <img id="dish-modal-img" class="dish-modal-img" src="" alt="">
                <div class="dish-modal-body">
                    <div class="dish-modal-top-row">
                        <span id="dish-modal-cat" class="dish-modal-cat"></span>
                        <span id="dish-modal-price" class="dish-modal-price"></span>
                    </div>
                    <h2 id="dish-modal-title" class="dish-modal-title"></h2>
                    <p class="dish-modal-comp-label">Composition & préparation</p>
                    <p id="dish-modal-desc" class="dish-modal-desc"></p>
                    <span class="dish-modal-badge-avail">✓ Disponible à la carte</span>
                </div>
            </div>
        </div>
    `;

    document.getElementById('detail-fav-btn').addEventListener('click', () => toggleFav(r.id_restaurant));
    document.getElementById('dish-modal-close').addEventListener('click', closeDishModal);
    document.getElementById('dish-modal').addEventListener('click', (e) => {
        if (e.target.id === 'dish-modal') closeDishModal();
    });
}

function renderOrientPanel(r) {
    const lat = encodeURIComponent(r.latitude ?? '');
    const lng = encodeURIComponent(r.longitude ?? '');
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    const embedUrl = `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
    const adresse = escapeHtml(r.adresse);
    const telSafe = escapeHtml(r.telephone || '');
    const telHref = encodeURIComponent(r.telephone || '');

    return `
        <div class="orient-card">
            <p class="orient-address"><strong>Adresse</strong><br>${adresse}</p>
            ${r.telephone ? `
                <div class="orient-phone-row">
                    📞 <a href="tel:${telHref}" class="orient-phone-link">${telSafe}</a>
                </div>
            ` : ''}
            <iframe class="orient-map-frame" src="${embedUrl}" loading="lazy" title="Carte de localisation"></iframe>
            <a href="${mapsUrl}" target="_blank" rel="noopener noreferrer" class="btn-primary orient-maps-btn">
                Ouvrir dans Google Maps →
            </a>
        </div>
    `;
}

function switchTab(tab) {
    document.querySelectorAll('.detail-tab').forEach(el => el.classList.toggle('active', el.dataset.tab === tab));
    document.querySelectorAll('.detail-panel').forEach(el => el.classList.remove('active'));
    document.getElementById(`panel-${tab}`).classList.add('active');
}

function toggleFav(id) {
    let favs = getFavs();
    const isFav = favs.includes(id);
    favs = isFav ? favs.filter(fid => fid !== id) : [...favs, id];
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
    document.getElementById('detail-fav-btn').textContent = isFav ? '🤍' : '❤️';
    Toast.success(isFav ? 'Retiré des favoris' : 'Ajouté aux favoris');
}

// ============================================================
//  MENUS & MODALE COMPOSITION
// ============================================================
function resolveDishPhoto(dish) {
    if (dish.image_url && /^https?:\/\//i.test(dish.image_url)) {
        return dish.image_url;
    }
    return getDistinctFallbackPhoto((Number(dish.id_menu) || 1) + 5);
}

async function loadMenu() {
    const panel = document.getElementById('panel-menus');
    try {
        CURRENT_MENU_ITEMS = await API.get('menus', { restaurant_id: CURRENT_RESTO_ID });

        if (!CURRENT_MENU_ITEMS.length) {
            panel.innerHTML = emptyState('Aucun menu publié pour le moment.');
            return;
        }

        const categories = {};
        CURRENT_MENU_ITEMS.forEach(item => {
            const cat = item.categorie || 'Plats';
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push(item);
        });

        panel.innerHTML = Object.entries(categories).map(([cat, dishes]) => `
            <h3 class="menu-category-title">${escapeHtml(cat)}</h3>
            ${dishes.map(d => {
                const menuId = Number(d.id_menu);
                const imgUrl = escapeHtml(resolveDishPhoto(d));
                const titre = escapeHtml(d.titre);
                const desc = escapeHtml(d.description || 'Préparation maison avec des produits frais sélectionnés à Pointe-Noire.');
                const prix = Number(d.prix).toLocaleString('fr-FR');
                return `
                    <div class="menu-dish-card" role="button" tabindex="0"
                         onclick="openDishModal(${menuId})"
                         onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openDishModal(${menuId});}">
                        <img class="menu-dish-img" src="${imgUrl}" alt="${titre}">
                        <div class="menu-dish-info">
                            <div class="menu-dish-title">${titre}</div>
                            <div class="menu-dish-desc">${desc}</div>
                            <span class="menu-dish-more">Voir la composition →</span>
                        </div>
                        <div class="menu-dish-price">${prix} FCFA</div>
                    </div>
                `;
            }).join('')}
        `).join('');
    } catch (e) {
        panel.innerHTML = emptyState('Impossible de charger le menu.');
    }
}

function openDishModal(menuId) {
    const dish = CURRENT_MENU_ITEMS.find(m => Number(m.id_menu) === Number(menuId));
    if (!dish) return;

    const modal = document.getElementById('dish-modal');
    if (!modal) return;

    const imgEl = document.getElementById('dish-modal-img');
    imgEl.src = resolveDishPhoto(dish);
    imgEl.alt = dish.titre || 'Plat';

    document.getElementById('dish-modal-cat').textContent = dish.categorie || 'Plat';
    document.getElementById('dish-modal-price').textContent = `${Number(dish.prix).toLocaleString('fr-FR')} FCFA`;
    document.getElementById('dish-modal-title').textContent = dish.titre || '';
    document.getElementById('dish-modal-desc').textContent =
        dish.description || 'Préparation maison élaborée à partir de produits frais locaux sélectionnés par le chef.';

    modal.classList.remove('hidden');
}

function closeDishModal() {
    const modal = document.getElementById('dish-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// ============================================================
//  AVIS
// ============================================================
async function loadReviews() {
    const panel = document.getElementById('panel-avis');
    const user = Auth.getUser();
    const isAuthenticated = Auth.isAuthenticated();

    let reviews = [];
    try {
        reviews = await API.get('reviews', { restaurant_id: CURRENT_RESTO_ID });
    } catch (e) {
        panel.innerHTML = emptyState('Impossible de charger les avis.');
        return;
    }

    const myReview = isAuthenticated
        ? reviews.find(r => r.utilisateur_id === user.id_utilisateur)
        : null;

    const myComment = myReview ? escapeHtml(myReview.commentaire || '') : '';

    panel.innerHTML = `
        <div class="review-add-card">
            <p class="review-add-title">${myReview ? 'Modifier votre avis' : 'Laisser un avis'}</p>
            <div class="star-picker" id="star-picker"></div>
            <textarea id="review-comment-input" class="auth-input review-textarea" rows="3"
                      placeholder="Votre commentaire (optionnel)...">${myComment}</textarea>
            <button type="button" class="btn-primary" id="btn-submit-review">${myReview ? 'Mettre à jour' : 'Publier mon avis'}</button>
        </div>

        <div id="reviews-list">
            ${reviews.length ? reviews.map(r => renderReviewCard(r, user)).join('') : emptyState('Aucun avis pour le moment. Soyez le premier !')}
        </div>
    `;

    EDITING_REVIEW_ID = myReview ? myReview.id_avis : null;
    SELECTED_RATING = myReview ? myReview.note : 5;
    renderStarPicker();

    document.getElementById('btn-submit-review').addEventListener('click', submitReview);
}

function renderReviewCard(r, user) {
    const isMine = Boolean(Auth.isAuthenticated() && r.utilisateur_id === user.id_utilisateur);
    const rawAuthor = r.est_anonyme
        ? (r.nom_anonyme || 'Visiteur Anonyme')
        : `${r.prenom || ''} ${r.nom || ''}`.trim();
    const authorName = escapeHtml(rawAuthor || 'Anonyme');
    const comment = escapeHtml(r.commentaire || '');
    const ownerReply = escapeHtml(r.reponse_restaurateur || '');
    const note = Math.max(1, Math.min(5, Number(r.note) || 5));
    const date = new Date(r.date_publication).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

    return `
        <div class="review-card">
            <div class="review-card-header">
                <div>
                    <span class="review-author">${authorName}</span>
                    ${isMine ? '<span class="review-own-badge">Vous</span>' : ''}
                    <div class="review-date">${escapeHtml(date)}</div>
                </div>
                <div class="review-stars">${'★'.repeat(note)}${'☆'.repeat(5 - note)}</div>
            </div>
            ${comment ? `<p class="review-comment">${comment}</p>` : ''}
            ${ownerReply ? `<div class="review-owner-reply">✍️ Réponse de l'établissement : ${ownerReply}</div>` : ''}
        </div>
    `;
}

function renderStarPicker() {
    const picker = document.getElementById('star-picker');
    picker.innerHTML = [1, 2, 3, 4, 5].map(n => `
        <button type="button" class="${n <= SELECTED_RATING ? 'filled' : ''}" data-star="${n}">★</button>
    `).join('');

    picker.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            SELECTED_RATING = parseInt(btn.dataset.star, 10);
            renderStarPicker();
        });
    });
}

async function submitReview() {
    const user = Auth.getUser();
    const comment = document.getElementById('review-comment-input').value.trim();
    const btn = document.getElementById('btn-submit-review');

    btn.disabled = true;

    try {
        if (EDITING_REVIEW_ID) {
            await API.post('reviews', {
                id_avis: EDITING_REVIEW_ID,
                note: SELECTED_RATING,
                commentaire: comment
            });
            Toast.success('Votre avis a été mis à jour !');
        } else {
            await API.post('reviews', {
                restaurant_id: CURRENT_RESTO_ID,
                nom_anonyme: !Auth.isAuthenticated() ? 'Visiteur Anonyme' : user.nom,
                note: SELECTED_RATING,
                commentaire: comment
            });
            Toast.success('Avis publié, merci !');
        }
        loadReviews();
    } catch (e) {
        Toast.error(e.message || "Impossible d'enregistrer l'avis.");
        btn.disabled = false;
    }
}
let CURRENT_RESTO = null;
let CURRENT_RESTO_ID = null;
let SELECTED_RATING = 5;
let EDITING_REVIEW_ID = null;

document.addEventListener('DOMContentLoaded', async () => {
    Auth.initClientSession();

    const params = new URLSearchParams(window.location.search);
    CURRENT_RESTO_ID = parseInt(params.get('id'));

    if (!CURRENT_RESTO_ID) {
        document.getElementById('detail-root').innerHTML = emptyState('Restaurant introuvable.');
        return;
    }

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
    return `<p style="text-align:center; padding: 3rem 1rem; color: var(--gray);">${msg}</p>`;
}

function statusClass(statut) {
    if (statut === 'Ouvert') return 'status-ouvert';
    if (statut === 'Ferme bientot') return 'status-ferme-bientot';
    return 'status-fermé';
}

function getHeroImage(type) {
    const t = String(type || '').toLowerCase();
    if (t.includes('maquis'))        return 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=900&q=80';
    if (t.includes('fruits de mer')) return 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=900&q=80';
    if (t.includes('fast'))          return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=900&q=80';
    if (t.includes('grillade'))      return 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=900&q=80';
    if (t.includes('boulanger'))     return 'https://images.unsplash.com/photo-1549931319-a545749fcd09?w=900&q=80';
    return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=900&q=80';
}

function render() {
    const r = CURRENT_RESTO;
    const favs = JSON.parse(localStorage.getItem('pointeresto_favs') || '[]');
    const isFav = favs.includes(r.id_restaurant);

    document.title = `PointeResto — ${r.nom}`;

    document.getElementById('detail-root').innerHTML = `
        <div class="detail-hero">
            <img src="${getHeroImage(r.type_restaurant)}" alt="${r.nom}">
            <a href="Index.html" class="detail-back-btn" aria-label="Retour">←</a>
            <button class="detail-fav-btn" id="detail-fav-btn" aria-label="Favori">${isFav ? '❤️' : '🤍'}</button>
            <div class="detail-hero-text">
                <h1 class="detail-title">${r.nom}</h1>
                <p class="detail-subtitle">${r.nom_quartier || 'Pointe-Noire'}</p>
            </div>
        </div>

        <div class="detail-status-row">
            <span class="detail-pill ${statusClass(r.statut_ouverture)}">${r.statut_ouverture}</span>
            <span class="detail-pill" style="background:var(--dark);">${r.type_restaurant || ''}</span>
            <span class="detail-pill" style="background:#FFB300; color:#1A1A1A;">★ ${Number(r.note_moyenne || 0).toFixed(1)}</span>
        </div>

        ${r.description ? `<p class="detail-description">${r.description}</p>` : ''}

        <div class="detail-tabs">
            <button class="detail-tab active" data-tab="menus" onclick="switchTab('menus')">🍽️ Menus</button>
            <button class="detail-tab" data-tab="avis" onclick="switchTab('avis')">⭐ Avis</button>
            <button class="detail-tab" data-tab="orienter" onclick="switchTab('orienter')">📍 S'orienter</button>
        </div>

        <div class="detail-panel active" id="panel-menus">
            <p style="text-align:center; color:var(--gray); padding:2rem 0;">Chargement du menu…</p>
        </div>

        <div class="detail-panel" id="panel-avis">
            <p style="text-align:center; color:var(--gray); padding:2rem 0;">Chargement des avis…</p>
        </div>

        <div class="detail-panel" id="panel-orienter">
            ${renderOrientPanel(r)}
        </div>
    `;

    document.getElementById('detail-fav-btn').addEventListener('click', () => toggleFav(r.id_restaurant));
}

function renderOrientPanel(r) {
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${r.latitude},${r.longitude}`;
    const embedUrl = `https://maps.google.com/maps?q=${r.latitude},${r.longitude}&z=15&output=embed`;

    return `
        <div class="orient-card">
            <p class="orient-address"><strong>Adresse</strong><br>${r.adresse}</p>
            ${r.telephone ? `
                <div class="orient-phone-row">
                    📞 <a href="tel:${r.telephone}" style="color:var(--dark); text-decoration:none;">${r.telephone}</a>
                </div>
            ` : ''}
            <iframe class="orient-map-frame" src="${embedUrl}" loading="lazy"></iframe>
            <a href="${mapsUrl}" target="_blank" rel="noopener" class="btn-primary"
               style="display:block; text-align:center; text-decoration:none;">
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
    let favs = JSON.parse(localStorage.getItem('pointeresto_favs') || '[]');
    const isFav = favs.includes(id);
    favs = isFav ? favs.filter(fid => fid !== id) : [...favs, id];
    localStorage.setItem('pointeresto_favs', JSON.stringify(favs));
    document.getElementById('detail-fav-btn').textContent = isFav ? '🤍' : '❤️';
    Toast.success(isFav ? 'Retiré des favoris' : 'Ajouté aux favoris');
}

// ============================================================
//  MENUS
// ============================================================
async function loadMenu() {
    const panel = document.getElementById('panel-menus');
    try {
        const items = await API.get('menus', { restaurant_id: CURRENT_RESTO_ID });

        if (!items.length) {
            panel.innerHTML = emptyState('Aucun menu publié pour le moment.');
            return;
        }

        const categories = {};
        items.forEach(item => {
            const cat = item.categorie || 'Plats';
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push(item);
        });

        panel.innerHTML = Object.entries(categories).map(([cat, dishes]) => `
            <h3 class="menu-category-title">${cat}</h3>
            ${dishes.map(d => `
                <div class="menu-dish-card">
                    <img class="menu-dish-img" src="${d.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=80'}" alt="${d.titre}">
                    <div class="menu-dish-info">
                        <div class="menu-dish-title">${d.titre}</div>
                        ${d.description ? `<div class="menu-dish-desc">${d.description}</div>` : ''}
                    </div>
                    <div class="menu-dish-price">${Number(d.prix).toLocaleString('fr-FR')} FCFA</div>
                </div>
            `).join('')}
        `).join('');
    } catch (e) {
        panel.innerHTML = emptyState('Impossible de charger le menu.');
    }
}

// ============================================================
//  AVIS
// ============================================================
async function loadReviews() {
    const panel = document.getElementById('panel-avis');
    const user = Auth.getUser();

    let reviews = [];
    try {
        reviews = await API.get('reviews', { restaurant_id: CURRENT_RESTO_ID });
    } catch (e) {
        panel.innerHTML = emptyState('Impossible de charger les avis.');
        return;
    }

    const myReview = user.id_utilisateur !== 0
        ? reviews.find(r => r.utilisateur_id === user.id_utilisateur)
        : null;

    panel.innerHTML = `
        <div class="review-add-card">
            <p class="review-add-title">${myReview ? 'Modifier votre avis' : 'Laisser un avis'}</p>
            <div class="star-picker" id="star-picker"></div>
            <textarea id="review-comment-input" class="auth-input" rows="3"
                      placeholder="Votre commentaire (optionnel)..."
                      style="resize:vertical; margin-bottom:0.8rem;">${myReview ? (myReview.commentaire || '') : ''}</textarea>
            <button class="btn-primary" id="btn-submit-review">${myReview ? 'Mettre à jour' : 'Publier mon avis'}</button>
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
    const isMine = user.id_utilisateur !== 0 && r.utilisateur_id === user.id_utilisateur;
    const authorName = r.est_anonyme ? (r.nom_anonyme || 'Visiteur Anonyme') : `${r.prenom || ''} ${r.nom || ''}`.trim();
    const date = new Date(r.date_publication).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

    return `
        <div class="review-card">
            <div class="review-card-header">
                <div>
                    <span class="review-author">${authorName || 'Anonyme'}</span>
                    ${isMine ? '<span class="review-own-badge">Vous</span>' : ''}
                    <div class="review-date">${date}</div>
                </div>
                <div class="review-stars">${'★'.repeat(r.note)}${'☆'.repeat(5 - r.note)}</div>
            </div>
            ${r.commentaire ? `<p class="review-comment">${r.commentaire}</p>` : ''}
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
            SELECTED_RATING = parseInt(btn.dataset.star);
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
                utilisateur_id: user.id_utilisateur,
                note: SELECTED_RATING,
                commentaire: comment
            });
            Toast.success('Votre avis a été mis à jour !');
        } else {
            await API.post('reviews', {
                restaurant_id: CURRENT_RESTO_ID,
                utilisateur_id: user.id_utilisateur === 0 ? null : user.id_utilisateur,
                nom_anonyme: user.id_utilisateur === 0 ? 'Visiteur Anonyme' : user.nom,
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

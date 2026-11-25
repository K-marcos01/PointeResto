let CURRENT_USER = null;
let CURRENT_RESTO_ID = null;
let RESTOS = [];
let CURRENT_MENUS = [];
let EDIT_MENU_ID = null;

document.addEventListener('DOMContentLoaded', () => {
    CURRENT_USER = Auth.getUser();
    const token = Auth.getToken();

    if (!token || !CURRENT_USER || CURRENT_USER.id_utilisateur === 0 ||
        (CURRENT_USER.role !== 'restaurateur' && CURRENT_USER.role !== 'moderateur')) {
        window.location.href = 'Connexion.html';
        return;
    }

    document.getElementById('welcome-msg').textContent =
        `Bonjour, ${CURRENT_USER.prenom} ${CURRENT_USER.nom} 👋`;
        const avatarEl = document.getElementById('dash-avatar-initials');
    if (avatarEl) {
        avatarEl.textContent = Auth.getUserInitials();
        avatarEl.title = `${CURRENT_USER.prenom} ${CURRENT_USER.nom}`;
    }

    document.getElementById('btn-logout').addEventListener('click', () => {
        Auth.logout('Connexion.html');
    });

    document.getElementById('resto-select').addEventListener('change', e => {
        CURRENT_RESTO_ID = parseInt(e.target.value, 10) || null;
        if (CURRENT_RESTO_ID) {
            updateCurrentStatusLabel();
            loadMenus();
        }
    });

    loadStats();
    loadRestaurants();
    loadAllAvis();
});

// ============================================================
//  ONGLETS
// ============================================================
function switchTab(tab) {
    document.querySelectorAll('.dash-tab').forEach(el =>
        el.classList.toggle('active', el.dataset.tab === tab));
    document.querySelectorAll('.dash-panel').forEach(el =>
        el.classList.remove('active'));
    document.getElementById(`panel-${tab}`).classList.add('active');

    if (tab === 'menus' && CURRENT_RESTO_ID) loadMenus();
    if (tab === 'avis') loadAllAvis();
}

// ============================================================
//  STATS
// ============================================================
async function loadStats() {
    try {
        const s = await API.get('dashboard', { action: 'stats' });
        document.getElementById('stat-restos').textContent = s.total_restos;
        document.getElementById('stat-rating').textContent = parseFloat(s.note_globale).toFixed(1) + ' /5';
        document.getElementById('stat-avis').textContent = s.total_avis;
    } catch (e) {
        if (e.status === 401 || e.status === 403) {
            Auth.logout('Connexion.html');
        }
    }
}

// ============================================================
//  RESTAURANTS
// ============================================================
async function loadRestaurants() {
    try {
        RESTOS = await API.get('dashboard', { action: 'restaurants' });
        const sel = document.getElementById('resto-select');
        if (!RESTOS.length) {
            sel.innerHTML = '<option value="">Aucun établissement trouvé</option>';
            return;
        }
        sel.innerHTML = RESTOS.map(r =>
            `<option value="${Number(r.id_restaurant)}">${escapeHtml(r.nom)} (${escapeHtml(r.nom_quartier || 'PNR')})</option>`
        ).join('');
        CURRENT_RESTO_ID = RESTOS[0].id_restaurant;
        updateCurrentStatusLabel();
        loadMenus();
    } catch (e) {
        Toast.error('Impossible de charger vos restaurants.');
    }
}

function updateCurrentStatusLabel() {
    const resto = RESTOS.find(r => r.id_restaurant === CURRENT_RESTO_ID);
    if (resto) {
        document.getElementById('current-status').textContent = resto.statut_ouverture;
    }
}

// ============================================================
//  STATUT
// ============================================================
async function changeStatus(statut) {
    if (!CURRENT_RESTO_ID) { Toast.error('Sélectionnez un restaurant.'); return; }
    try {
        await API.post('dashboard', {
            action: 'status',
            restaurant_id: CURRENT_RESTO_ID,
            statut
        });
        const resto = RESTOS.find(r => r.id_restaurant === CURRENT_RESTO_ID);
        if (resto) resto.statut_ouverture = statut;
        document.getElementById('current-status').textContent = statut;
        Toast.success(`Statut mis à jour : ${statut}`);
    } catch (e) {
        Toast.error(e.message || 'Impossible de mettre à jour le statut.');
    }
}

// ============================================================
//  MENUS
// ============================================================
async function loadMenus() {
    const list = document.getElementById('menus-list');
    if (!CURRENT_RESTO_ID) return;
    list.innerHTML = '<p class="dash-muted-msg">Chargement…</p>';

    try {
        CURRENT_MENUS = await API.get('dashboard', {
            action: 'menus',
            restaurant_id: CURRENT_RESTO_ID
        });

        if (!CURRENT_MENUS.length) {
            list.innerHTML = '<p class="dash-muted-msg">Aucun plat pour le moment.</p>';
            return;
        }

        const categories = {};
        CURRENT_MENUS.forEach(m => {
            const c = m.categorie || 'Plat';
            if (!categories[c]) categories[c] = [];
            categories[c].push(m);
        });

        list.innerHTML = Object.entries(categories).map(([cat, items]) => `
            <p class="dash-cat-heading">${escapeHtml(cat)}</p>
            ${items.map(m => {
                const id = Number(m.id_menu);
                return `
                    <div class="menu-item-row">
                        <div class="menu-item-info">
                            <div class="menu-item-title">${escapeHtml(m.titre)}</div>
                            <div class="menu-item-meta">${escapeHtml(m.description || '')}</div>
                        </div>
                        <div class="menu-item-price">${Number(m.prix).toLocaleString('fr-FR')} FCFA</div>
                        <button class="btn-icon" title="Modifier" onclick="startEditMenuById(${id})">✏️</button>
                        <button class="btn-icon danger" title="Supprimer" onclick="deleteMenu(${id})">🗑️</button>
                    </div>
                `;
            }).join('')}
        `).join('');
    } catch (e) {
        list.innerHTML = '<p class="dash-error-msg">Impossible de charger le menu.</p>';
    }
}

function startEditMenuById(menuId) {
    const menu = CURRENT_MENUS.find(m => Number(m.id_menu) === Number(menuId));
    if (!menu) return;

    EDIT_MENU_ID = menu.id_menu;
    document.getElementById('m-titre').value = menu.titre || '';
    document.getElementById('m-description').value = menu.description || '';
    document.getElementById('m-prix').value = menu.prix ?? 0;
    document.getElementById('m-categorie').value = menu.categorie || '';
    document.getElementById('m-image').value = menu.image_url || '';
    document.getElementById('btn-add-menu').textContent = '💾 Mettre à jour ce plat';
    switchTab('menus');
    document.getElementById('m-titre').scrollIntoView({ behavior: 'smooth' });
}

async function submitMenu() {
    const titre = document.getElementById('m-titre').value.trim();
    const prixRaw = document.getElementById('m-prix').value.trim();
    const prix = parseInt(prixRaw, 10);

    if (!titre || prixRaw === '' || Number.isNaN(prix) || prix < 0) {
        Toast.error('Le nom et un prix valide (≥ 0) sont obligatoires.');
        return;
    }
    if (!CURRENT_RESTO_ID) { Toast.error('Sélectionnez un restaurant.'); return; }

    const data = {
        action: EDIT_MENU_ID ? 'menu-update' : 'menu-add',
        restaurant_id: CURRENT_RESTO_ID,
        id_menu: EDIT_MENU_ID,
        titre,
        description: document.getElementById('m-description').value.trim(),
        prix,
        categorie: document.getElementById('m-categorie').value.trim() || 'Plat',
        image_url: document.getElementById('m-image').value.trim() || null
    };

    try {
        await API.post('dashboard', data);
        Toast.success(EDIT_MENU_ID ? 'Plat mis à jour !' : 'Plat ajouté !');
        resetMenuForm();
        loadMenus();
        loadStats();
    } catch (e) {
        Toast.error(e.message || "Impossible d'enregistrer le plat.");
    }
}

async function deleteMenu(menuId) {
    if (!confirm('Supprimer ce plat définitivement ?')) return;
    try {
        await API.post('dashboard', {
            action: 'menu-delete',
            id_menu: menuId
        });
        Toast.success('Plat supprimé.');
        loadMenus();
        loadStats();
    } catch (e) {
        Toast.error(e.message || 'Impossible de supprimer ce plat.');
    }
}

function resetMenuForm() {
    EDIT_MENU_ID = null;
    ['m-titre', 'm-categorie', 'm-prix', 'm-description', 'm-image']
        .forEach(id => { document.getElementById(id).value = ''; });
    document.getElementById('btn-add-menu').textContent = '+ Ajouter ce plat';
}

// ============================================================
//  AVIS
// ============================================================
async function loadAllAvis() {
    const list = document.getElementById('avis-list');
    list.innerHTML = '<p class="dash-muted-msg">Chargement…</p>';

    try {
        const avis = await API.get('dashboard', { action: 'avis' });

        if (!avis.length) {
            list.innerHTML = '<p class="dash-muted-msg">Aucun avis pour le moment.</p>';
            return;
        }

        list.innerHTML = `<div class="dash-section">${avis.map(a => {
            const idAvis = Number(a.id_avis);
            const note = Math.max(1, Math.min(5, Number(a.note) || 5));
            const auteur = escapeHtml(a.auteur || 'Anonyme');
            const resto = escapeHtml(a.nom_restaurant || '');
            const comment = escapeHtml(a.commentaire || '');
            const reponse = escapeHtml(a.reponse_restaurateur || '');

            return `
                <div class="avis-card">
                    <div class="avis-header">
                        <span class="avis-author">${auteur}</span>
                        <span class="avis-stars">${'★'.repeat(note)}${'☆'.repeat(5 - note)}</span>
                    </div>
                    <p class="avis-resto">📍 ${resto}</p>
                    ${comment ? `<p class="avis-comment">"${comment}"</p>` : ''}
                    ${reponse ? `<div class="avis-reponse-box">✍️ Votre réponse : ${reponse}</div>` : ''}
                    <div class="avis-reponse-form">
                        <textarea id="rep-${idAvis}" rows="2"
                                  placeholder="${reponse ? 'Modifier votre réponse…' : 'Répondre à cet avis…'}">${reponse}</textarea>
                        <button class="btn-dash-primary" onclick="repondre(${idAvis})">
                            ${reponse ? '💾' : '↩️'}
                        </button>
                    </div>
                </div>
            `;
        }).join('')}</div>`;
    } catch (e) {
        list.innerHTML = '<p class="dash-error-msg">Impossible de charger les avis.</p>';
    }
}

async function repondre(avisId) {
    const reponse = document.getElementById(`rep-${avisId}`).value.trim();
    if (!reponse) { Toast.error('La réponse ne peut pas être vide.'); return; }

    try {
        await API.post('dashboard', {
            action: 'repondre-avis',
            id_avis: avisId,
            reponse
        });
        Toast.success('Réponse publiée !');
        loadAllAvis();
    } catch (e) {
        Toast.error(e.message || 'Impossible de publier la réponse.');
    }
}
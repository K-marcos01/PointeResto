let CURRENT_USER = null;
let CURRENT_RESTO_ID = null;
let RESTOS = [];
let EDIT_MENU_ID = null;

document.addEventListener('DOMContentLoaded', () => {
    CURRENT_USER = Auth.getUser();

    // Rediriger si non connecté ou non restaurateur
    if (!CURRENT_USER || CURRENT_USER.id_utilisateur === 0 ||
        (CURRENT_USER.role !== 'restaurateur' && CURRENT_USER.role !== 'moderateur')) {
        window.location.href = 'Connexion.html';
        return;
    }

    document.getElementById('welcome-msg').textContent =
        `Bonjour, ${CURRENT_USER.prenom} ${CURRENT_USER.nom} 👋`;

    document.getElementById('btn-logout').addEventListener('click', () => {
        Auth.logout();
        window.location.href = 'Connexion.html';
    });

    document.getElementById('resto-select').addEventListener('change', e => {
        CURRENT_RESTO_ID = parseInt(e.target.value) || null;
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
        const s = await API.get('dashboard', { action: 'stats', user_id: CURRENT_USER.id_utilisateur });
        document.getElementById('stat-restos').textContent = s.total_restos;
        document.getElementById('stat-rating').textContent = parseFloat(s.note_globale).toFixed(1) + ' /5';
        document.getElementById('stat-avis').textContent = s.total_avis;
    } catch (e) {
        console.error('Stats error', e);
    }
}

// ============================================================
//  RESTAURANTS
// ============================================================
async function loadRestaurants() {
    try {
        RESTOS = await API.get('dashboard', { action: 'restaurants', user_id: CURRENT_USER.id_utilisateur });
        const sel = document.getElementById('resto-select');
        if (!RESTOS.length) {
            sel.innerHTML = '<option value="">Aucun établissement trouvé</option>';
            return;
        }
        sel.innerHTML = RESTOS.map(r =>
            `<option value="${r.id_restaurant}">${r.nom} (${r.nom_quartier || 'PNR'})</option>`
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
            user_id: CURRENT_USER.id_utilisateur,
            restaurant_id: CURRENT_RESTO_ID,
            statut
        }, true);
        // Mettre à jour l'affichage local
        const resto = RESTOS.find(r => r.id_restaurant === CURRENT_RESTO_ID);
        if (resto) resto.statut_ouverture = statut;
        document.getElementById('current-status').textContent = statut;
        Toast.success(`Statut mis à jour : ${statut}`);
    } catch (e) {
        Toast.error('Impossible de mettre à jour le statut.');
    }
}

// ============================================================
//  MENUS
// ============================================================
async function loadMenus() {
    const list = document.getElementById('menus-list');
    if (!CURRENT_RESTO_ID) return;
    list.innerHTML = '<p style="color:var(--gray);">Chargement…</p>';

    try {
        const menus = await API.get('dashboard', {
            action: 'menus',
            user_id: CURRENT_USER.id_utilisateur,
            restaurant_id: CURRENT_RESTO_ID
        });

        if (!menus.length) {
            list.innerHTML = '<p style="color:var(--gray); font-size:0.9rem;">Aucun plat pour le moment.</p>';
            return;
        }

        const categories = {};
        menus.forEach(m => {
            const c = m.categorie || 'Plat';
            if (!categories[c]) categories[c] = [];
            categories[c].push(m);
        });

        list.innerHTML = Object.entries(categories).map(([cat, items]) => `
            <p style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.08em;
                      color:var(--gray); margin: 1rem 0 0.5rem; font-weight:700;">${cat}</p>
            ${items.map(m => `
                <div class="menu-item-row">
                    <div class="menu-item-info">
                        <div class="menu-item-title">${m.titre}</div>
                        <div class="menu-item-meta">${m.description || ''}</div>
                    </div>
                    <div class="menu-item-price">${Number(m.prix).toLocaleString('fr-FR')} FCFA</div>
                    <button class="btn-icon" title="Modifier" onclick="startEditMenu(${m.id_menu}, '${escStr(m.titre)}', '${escStr(m.description || '')}', ${m.prix}, '${escStr(m.categorie || '')}')">✏️</button>
                    <button class="btn-icon danger" title="Supprimer" onclick="deleteMenu(${m.id_menu})">🗑️</button>
                </div>
            `).join('')}
        `).join('');
    } catch (e) {
        list.innerHTML = '<p style="color:#c62828;">Impossible de charger le menu.</p>';
    }
}

function escStr(str) {
    return String(str).replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function startEditMenu(id, titre, desc, prix, cat) {
    EDIT_MENU_ID = id;
    document.getElementById('m-titre').value = titre;
    document.getElementById('m-description').value = desc;
    document.getElementById('m-prix').value = prix;
    document.getElementById('m-categorie').value = cat;
    document.getElementById('btn-add-menu').textContent = '💾 Mettre à jour ce plat';
    switchTab('menus');
    document.getElementById('m-titre').scrollIntoView({ behavior: 'smooth' });
}

async function submitMenu() {
    const titre = document.getElementById('m-titre').value.trim();
    const prix  = parseInt(document.getElementById('m-prix').value);

    if (!titre || !prix) { Toast.error('Le nom et le prix sont obligatoires.'); return; }
    if (!CURRENT_RESTO_ID) { Toast.error('Sélectionnez un restaurant.'); return; }

    const data = {
        action: EDIT_MENU_ID ? 'menu-update' : 'menu-add',
        user_id: CURRENT_USER.id_utilisateur,
        restaurant_id: CURRENT_RESTO_ID,
        id_menu: EDIT_MENU_ID,
        titre,
        description: document.getElementById('m-description').value.trim(),
        prix,
        categorie: document.getElementById('m-categorie').value.trim() || 'Plat',
        image_url: document.getElementById('m-image').value.trim() || null,
    };

    try {
        await API.post('dashboard', data);
        Toast.success(EDIT_MENU_ID ? 'Plat mis à jour !' : 'Plat ajouté !');
        resetMenuForm();
        loadMenus();
        loadStats();
    } catch (e) {
        Toast.error('Impossible d\'enregistrer le plat.');
    }
}

async function deleteMenu(menuId) {
    if (!confirm('Supprimer ce plat définitivement ?')) return;
    try {
        await API.post('dashboard', {
            action: 'menu-delete',
            user_id: CURRENT_USER.id_utilisateur,
            id_menu: menuId
        }, true);
        Toast.success('Plat supprimé.');
        loadMenus();
        loadStats();
    } catch (e) {
        Toast.error('Impossible de supprimer ce plat.');
    }
}

function resetMenuForm() {
    EDIT_MENU_ID = null;
    ['m-titre', 'm-categorie', 'm-prix', 'm-description', 'm-image']
        .forEach(id => document.getElementById(id).value = '');
    document.getElementById('btn-add-menu').textContent = '+ Ajouter ce plat';
}

// ============================================================
//  AVIS
// ============================================================
async function loadAllAvis() {
    const list = document.getElementById('avis-list');
    list.innerHTML = '<p style="color:var(--gray); font-size:0.9rem; padding:1rem 0;">Chargement…</p>';

    try {
        const avis = await API.get('dashboard', { action: 'avis', user_id: CURRENT_USER.id_utilisateur });

        if (!avis.length) {
            list.innerHTML = '<p style="color:var(--gray); font-size:0.9rem; padding:1rem 0;">Aucun avis pour le moment.</p>';
            return;
        }

        list.innerHTML = `<div class="dash-section">${avis.map(a => `
            <div class="avis-card">
                <div class="avis-header">
                    <span class="avis-author">${a.auteur || 'Anonyme'}</span>
                    <span class="avis-stars">${'★'.repeat(a.note)}${'☆'.repeat(5 - a.note)}</span>
                </div>
                <p class="avis-resto">📍 ${a.nom_restaurant}</p>
                ${a.commentaire ? `<p class="avis-comment">"${a.commentaire}"</p>` : ''}
                ${a.reponse_restaurateur
                    ? `<div class="avis-reponse-box">✍️ Votre réponse : ${a.reponse_restaurateur}</div>`
                    : ''}
                <div class="avis-reponse-form">
                    <textarea id="rep-${a.id_avis}" rows="2"
                              placeholder="${a.reponse_restaurateur ? 'Modifier votre réponse…' : 'Répondre à cet avis…'}"
                    >${a.reponse_restaurateur || ''}</textarea>
                    <button class="btn-dash-primary" onclick="repondre(${a.id_avis})">
                        ${a.reponse_restaurateur ? '💾' : '↩️'}
                    </button>
                </div>
            </div>
        `).join('')}</div>`;
    } catch (e) {
        list.innerHTML = '<p style="color:#c62828;">Impossible de charger les avis.</p>';
    }
}

async function repondre(avisId) {
    const reponse = document.getElementById(`rep-${avisId}`).value.trim();
    if (!reponse) { Toast.error('La réponse ne peut pas être vide.'); return; }

    try {
        await API.post('dashboard', {
            action: 'repondre-avis',
            user_id: CURRENT_USER.id_utilisateur,
            id_avis: avisId,
            reponse
        }, true);
        Toast.success('Réponse publiée !');
        loadAllAvis();
    } catch (e) {
        Toast.error('Impossible de publier la réponse.');
    }
}

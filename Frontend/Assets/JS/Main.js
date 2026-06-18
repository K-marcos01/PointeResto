let showOnlyFavs = false;
document.addEventListener('DOMContentLoaded', () => {
    Auth.initClientSession();
    document.getElementById('fav-count').textContent = JSON.parse(localStorage.getItem('pointeresto_favs') || '[]').length;
    initFilters(); loadRestaurants();
    document.getElementById('search-input').addEventListener('input', debounce(loadRestaurants, 300));
    document.getElementById('quartier-select').addEventListener('change', loadRestaurants);
    document.getElementById('btn-toggle-favs').addEventListener('click', toggleFavsFilter);
});

async function loadRestaurants() {
    const search = document.getElementById('search-input').value;
    const workspace = document.getElementById('quartier-select').value;
    let list = await API.get('restaurants', { action: 'list', search, workspace });
    if (showOnlyFavs) { list = list.filter(r => JSON.parse(localStorage.getItem('pointeresto_favs') || '[]').includes(r.id_restaurant)); }

    document.getElementById('restaurants-container').innerHTML = list.map(r => `
        <article class="restaurant-card">
            <img src="${String(r.type_restaurant).toLowerCase().includes('maquis') ? 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400' : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400'}" class="card-img-top">
            <button class="btn-fav-card" onclick="toggleFav(${r.id_restaurant}, event)">${JSON.parse(localStorage.getItem('pointeresto_favs') || '[]').includes(r.id_restaurant) ? '❤️' : '🤍'}</button>
            <div class="card-body">
                <h2 class="card-title">${r.nom}</h2>
                <p class="card-address">${r.nom_quartier || 'Pointe-Noire'} - ${r.adresse}</p>
                <div class="card-actions">
                    <button class="btn-action" onclick="viewMenu(${r.id_restaurant}, '${r.nom.replace(/'/g, "\\'")}')">Menu</button>
                    <button class="btn-action" onclick="openReviewPopUp(${r.id_restaurant})"> Avis</button>
                    <button class="btn-action" onclick="window.open('https://www.google.com/maps/search/?api=1&query=${r.latitude},${r.longitude}', '_blank')">S'orienter</button>
                </div>
            </div>
        </article>
    `).join('');
}

async function viewMenu(restaurantId, restaurantNom) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Carte — ${restaurantNom}</h2>
                <button class="close-button" onclick="this.closest('.modal').remove()">×</button>
            </div>
            <p style="text-align:center; color:var(--gray); padding: 1rem 0;">Chargement du menu…</p>
        </div>
    `;
    document.body.appendChild(modal);

    // Fermer en cliquant sur le fond
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    try {
        const menuItems = await API.get('menus', { restaurant_id: restaurantId });
        const content = modal.querySelector('.modal-content');

        if (!menuItems.length) {
            content.querySelector('p').textContent = 'Aucun menu publié pour le moment.';
            return;
        }

        // Grouper par catégorie
        const categories = {};
        menuItems.forEach(item => {
            const cat = item.categorie || 'Plats';
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push(item);
        });

        const menuHTML = Object.entries(categories).map(([cat, items]) => `
            <section style="margin-bottom: 1.5rem;">
                <h3 style="font-size:0.85rem; text-transform:uppercase; letter-spacing:0.1em;
                           color:var(--gray); border-bottom:1px solid var(--border);
                           padding-bottom:0.4rem; margin-bottom:0.8rem;">${cat}</h3>
                ${items.map(item => `
                    <div class="menu-item">
                        <div class="menu-item-header">
                            <span>${item.titre}</span>
                            <span style="color:var(--primary); white-space:nowrap; margin-left:1rem;">
                                ${Number(item.prix).toLocaleString('fr-FR')} FCFA
                            </span>
                        </div>
                        ${item.description ? `<p style="font-size:0.88rem; color:var(--gray); margin-top:0.3rem;">${item.description}</p>` : ''}
                    </div>
                `).join('')}
            </section>
        `).join('');

        content.innerHTML = `
            <div class="modal-header">
                <h2>Carte — ${restaurantNom}</h2>
                <button class="close-button" onclick="this.closest('.modal').remove()">×</button>
            </div>
            <div>${menuHTML}</div>
        `;
    } catch (e) {
        console.error('Erreur chargement menu', e);
        modal.querySelector('p').textContent = 'Impossible de charger le menu. Vérifiez votre connexion.';
    }
}

function openReviewPopUp(id) { 
    document.getElementById('modal-resto-id').value = id; 
    document.getElementById('modal-review-text').value = ''; 
    document.getElementById('review-modal').classList.remove('hidden'); 
}

function closeReviewModal() { 
    document.getElementById('review-modal').classList.add('hidden'); 
}

async function submitReview() { 
    const id = document.getElementById('modal-resto-id').value; 
    const comm = document.getElementById('modal-review-text').value; 
    const note = document.getElementById('modal-review-note').value; 
    const u = Auth.getUser(); if(!comm.trim()) return; 
    await API.post('reviews', { restaurant_id: parseInt(id), utilisateur_id: u.id_utilisateur === 0 ? null : u.id_utilisateur, nom_anonyme: u.id_utilisateur === 0 ? "Visiteur Anonyme" : u.nom, note: parseInt(note), commentaire: comm }); 
    closeReviewModal(); alert("Avis enregistré !"); 
    loadRestaurants(); 
}

function toggleFav(id, event) {
    event.stopPropagation(); 
    let favs = JSON.parse(localStorage.getItem('pointeresto_favs') || '[]'); 
    favs = favs.includes(id) ? favs.filter(fid => fid !== id) : [...favs, id]; 
    localStorage.setItem('pointeresto_favs', JSON.stringify(favs)); 
    document.getElementById('fav-count').textContent = favs.length; 
    loadRestaurants(); 
}

function toggleFavsFilter() { 
    showOnlyFavs = !showOnlyFavs; 
    loadRestaurants(); 
}

function initFilters() { 
    API.get('restaurants', { action: 'quartiers' }).then(qs => qs.forEach(q => { const opt = document.createElement('option'); 
    opt.value = q.id_workspace; opt.textContent = q.nom_quartier; 
    document.getElementById('quartier-select').appendChild(opt); 
})); 
}

function debounce(fn, d) { 
    let t; return (...args) => { clearTimeout(t); 
    t = setTimeout(() => fn(...args), d); 
}; 
}
// ============================================================
// BEAUTIFUL WOMEN - Logique Catalogue (catalogue.js)
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
    // Initialiser les filtres depuis l'URL
    const params = new URLSearchParams(window.location.search);
    const initialCategorie = params.get('categorie');
    const initialRecherche = params.get('recherche');

    if (initialRecherche) {
        document.getElementById('search-input').value = initialRecherche;
    }

    // Vérifier la santé du backend
    const health = await api.get('/health');
    if (!health.ok) {
        document.getElementById('results-count').innerHTML = `
            <div class="alert alert-danger" style="background:rgba(235,64,52,0.1); color:var(--rouge); padding:15px; border-radius:10px; margin-bottom:20px; text-align:center;">
                <i class="fas fa-exclamation-triangle"></i> 
                <strong>Attention :</strong> Le serveur backend n'est pas démarré. <br>
                Veuillez lancer <code>npm run demo</code> dans le dossier <code>backend</code> pour voir les produits et les images.
            </div>
        `;
        document.getElementById('catalogue-grid').innerHTML = '';
        return;
    }

    // Charger les filtres (catégories et vendeurs)
    await chargerFiltresSidebar();

    // Charger les produits
    await chargerProduitsDuCatalogue();

    // Init reveal
    setTimeout(initScrollReveal, 600);
});

// ============================================================
// CHARGEMENT DES FILTRES
// ============================================================
async function chargerFiltresSidebar() {
    const resCats = await api.get('/categories');
    const resVendeurs = await api.get('/vendeurs');

    // Catégories
    const catGrid = document.getElementById('filter-categories');
    if (resCats.ok && resCats.data.categories) {
        const catSlug = new URLSearchParams(window.location.search).get('categorie');
        catGrid.innerHTML = resCats.data.categories.map(c => `
            <label class="filter-option">
                <input type="checkbox" name="f-categorie" value="${c.id}" ${catSlug == c.slug ? 'checked' : ''} onchange="appliquerFiltres()">
                <span>${c.icone || ''} ${c.nom}</span>
            </label>
        `).join('');
    }

    // Vendeurs
    const vendGrid = document.getElementById('filter-vendeurs');
    if (resVendeurs.ok && resVendeurs.data.vendeurs) {
        const vendId = new URLSearchParams(window.location.search).get('vendeur_id');
        vendGrid.innerHTML = resVendeurs.data.vendeurs.map(v => `
            <label class="filter-option">
                <input type="checkbox" name="f-vendeur" value="${v.id}" ${vendId == v.id ? 'checked' : ''} onchange="appliquerFiltres()">
                <span>${v.nom_boutique}</span>
            </label>
        `).join('');
    }
}

// ============================================================
// CHARGEMENT DES PRODUITS
// ============================================================
let currentPage = 1;

async function chargerProduitsDuCatalogue(page = 1) {
    currentPage = page;
    const grid = document.getElementById('catalogue-grid');
    const countText = document.getElementById('results-count');

    // Construire les paramètres de recherche
    const params = new URLSearchParams(window.location.search);
    const searchParams = new URLSearchParams();
    searchParams.set('page', page);
    searchParams.set('limite', 12);
    
    // Favoris (spécial)
    if (params.get('favoris') === '1') {
        const favs = JSON.parse(localStorage.getItem('favoris_bw') || '[]');
        if (favs.length > 0) {
            searchParams.set('ids', favs.join(','));
        }
    }

    // Recherche
    const recherche = document.getElementById('search-input').value.trim();
    if (recherche) searchParams.set('recherche', recherche);

    // Tri
    const tri = document.getElementById('sort-by').value;
    searchParams.set('tri', tri);

    // Prix
    const min = document.getElementById('price-min').value;
    if (min) searchParams.set('prix_min', min);
    const max = document.getElementById('price-max').value;
    if (max) searchParams.set('prix_max', max);

    // Catégories (IDs)
    const checkedCats = Array.from(document.querySelectorAll('input[name="f-categorie"]:checked')).map(i => i.value);
    if (checkedCats.length > 0) {
        searchParams.set('categorie', checkedCats[0]);
    }

    // Vendeurs (IDs)
    const checkedVendeurs = Array.from(document.querySelectorAll('input[name="f-vendeur"]:checked')).map(i => i.value);
    if (checkedVendeurs.length > 0) {
        searchParams.set('vendeur_id', checkedVendeurs[0]);
    }

    // Afficher les skeletons
    grid.innerHTML = Array(6).fill('<div class="produit-card skeleton" style="height:350px"></div>').join('');

    const res = await api.get(`/produits?${searchParams.toString()}`);

    if (!res.ok || !res.data.produits || res.data.produits.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 60px; color: var(--gris);">
                <p style="font-size: 3rem;">📭</p>
                <p>Aucun produit ne correspond à ces critères.</p>
                <button class="btn btn-primary" style="margin-top:20px" onclick="resetFiltres()">Réinitialiser</button>
            </div>
        `;
        countText.textContent = '0 produit trouvé';
        document.getElementById('pagination').innerHTML = '';
        return;
    }

    countText.textContent = `${res.data.pagination.total} produit(s) trouvé(s)`;

    grid.innerHTML = res.data.produits.map(p => `
        <div class="produit-card reveal reveal-up">
            <div class="produit-card-img">
                <img loading="lazy" src="${api.getImageUrl(p.images)}" alt="${p.nom}" onerror="this.src='images/placeholder-pagne.jpg'">
                <button class="produit-card-fav" onclick="toggleFavori(this, ${p.id})">
                    <i class="far fa-heart"></i>
                </button>
            </div>
            <div class="produit-card-body">
                <div class="produit-card-cat">${p.categorie}</div>
                <div class="produit-card-nom">
                    <a href="produit.html?id=${p.id}">${p.nom}</a>
                </div>
                <div class="produit-card-boutique">
                    <i class="fas fa-store" style="color:var(--orange);font-size:0.75rem"></i> ${p.nom_boutique}
                </div>
                <div class="stars">${etoilesHTML(p.note_moyenne || 0)}</div>
            </div>
            <div class="produit-card-footer">
                <div class="produit-card-prix">${api.formatPrice(p.prix)}</div>
                <button class="btn-panier" onclick='ajouterAuPanier(${JSON.stringify(p).replace(/'/g, "&apos;")})'>
                    <i class="fas fa-shopping-bag"></i>
                </button>
            </div>
        </div>
    `).join('');

    // Relancer reveal pour les nouveaux produits
    setTimeout(initScrollReveal, 200);

    renderPagination(res.data.pagination);
}

// ============================================================
// PAGINATION
// ============================================================
function renderPagination(pg) {
    const paginContainer = document.getElementById('pagination');
    if (pg.pages <= 1) {
        paginContainer.innerHTML = '';
        return;
    }

    let html = '';
    for (let i = 1; i <= pg.pages; i++) {
        html += `<button class="page-btn ${pg.page === i ? 'active' : ''}" onclick="chargerProduitsDuCatalogue(${i})">${i}</button>`;
    }
    paginContainer.innerHTML = html;
}

// ============================================================
// ACTIONS
// ============================================================
function appliquerFiltres() {
    chargerProduitsDuCatalogue(1);
}

function resetFiltres() {
    document.getElementById('price-min').value = '';
    document.getElementById('price-max').value = '';
    document.getElementById('search-input').value = '';
    document.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = false);
    appliquerFiltres();
}



/** UI Helpers (favoris, panier, etoiles) are in ui.js */

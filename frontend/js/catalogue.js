// ============================================================
// BEAUTIFUL WOMEN - Logique Catalogue (catalogue.js)
// Rôle : Gérer l'affichage dynamique du catalogue de produits.
//        Prend en charge le filtrage multicritères (catégories, vendeurs,
//        prix, mots-clés, favoris), la pagination des résultats,
//        et l'affichage d'un état de chargement visuel (squelettes).
//
// Optimisations v2 :
//  - Debounce sur les filtres (évite les requêtes en rafale)
//  - AbortController (annule les requêtes en vol si un nouveau filtre est lancé)
//  - Lazy loading amélioré des images
//  - Gestion d'erreur robuste
// ============================================================

// ── ABORT CONTROLLER ─────────────────────────────────────────
// Permet d'annuler une requête en cours si l'utilisateur change un filtre
// avant que la précédente ne soit terminée.
let currentAbortController = null;

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialisation des filtres à partir des paramètres présents dans l'URL
    const params = new URLSearchParams(window.location.search);
    const initialRecherche = params.get('recherche');
    const initialCategorie = params.get('categorie');

    if (initialRecherche) {
        const si = document.getElementById('search-input');
        if (si) si.value = initialRecherche;
    }

    // 2. Contrôle de santé du backend
    const health = await api.get('/health');
    if (!health || !health.ok) {
        document.getElementById('results-count').innerHTML = `
            <div style="background:rgba(235,64,52,0.08); color:#c0392b; padding:18px 24px; border-radius:14px;
                        border-left: 4px solid #e74c3c; margin-bottom:20px; font-size:0.92rem;">
                <strong>⚠️ Serveur non disponible</strong><br>
                Veuillez démarrer le backend : <code>npm start</code> dans le dossier <code>backend</code>.
            </div>
        `;
        document.getElementById('catalogue-grid').innerHTML = '';
        return;
    }

    // 3. Chargement asynchrone des filtres de la sidebar
    await chargerFiltresSidebar(initialCategorie);

    // 4. Chargement initial des produits
    await chargerProduitsDuCatalogue(1);

    // 5. Animations scroll
    setTimeout(initScrollReveal, 600);

    // 6. Bouton "Retour en haut"
    initBoutonHaut();
});

// ============================================================
// CHARGEMENT DES FILTRES DE LA SIDEBAR
// ============================================================
async function chargerFiltresSidebar(preselectCat = null) {
    const [resCats, resVendeurs] = await Promise.all([
        api.get('/categories'),
        api.get('/vendeurs?all=1')
    ]);

    const catGrid = document.getElementById('filter-categories');
    if (resCats && resCats.ok && resCats.data.categories) {
        const catSlug = preselectCat || new URLSearchParams(window.location.search).get('categorie');
        catGrid.innerHTML = resCats.data.categories.map(c => `
            <label class="filter-option">
                <input type="checkbox" name="f-categorie" value="${c.id}"
                    ${(catSlug == c.slug || catSlug == c.id) ? 'checked' : ''}
                    onchange="appliquerFiltres()">
                <span>${c.icone || '🧵'} ${c.nom}</span>
            </label>
        `).join('');
    } else {
        catGrid.innerHTML = '<span style="color:var(--gris);font-size:0.85rem;">Chargement...</span>';
    }

    const vendGrid = document.getElementById('filter-vendeurs');
    if (resVendeurs && resVendeurs.ok && resVendeurs.data.vendeurs) {
        const vendId = new URLSearchParams(window.location.search).get('vendeur_id');
        vendGrid.innerHTML = resVendeurs.data.vendeurs.map(v => `
            <label class="filter-option">
                <input type="checkbox" name="f-vendeur" value="${v.id}"
                    ${vendId == v.id ? 'checked' : ''}
                    onchange="appliquerFiltres()">
                <span>${v.nom_boutique}</span>
            </label>
        `).join('');
    }
}

// ============================================================
// CHARGEMENT DES PRODUITS – avec AbortController
// ============================================================
let currentPage = 1;

async function chargerProduitsDuCatalogue(page = 1) {
    currentPage = page;
    const grid = document.getElementById('catalogue-grid');
    const countText = document.getElementById('results-count');

    // Annuler la requête précédente si elle est encore en cours
    if (currentAbortController) {
        currentAbortController.abort();
    }
    currentAbortController = new AbortController();

    // Afficher les skeletons de chargement
    grid.innerHTML = Array(9).fill('<div class="produit-card skeleton" style="height:350px"></div>').join('');
    countText.innerHTML = '<span class="loading-dots">Chargement</span>';

    // Construction des paramètres de filtre
    const params = new URLSearchParams(window.location.search);
    const searchParams = new URLSearchParams();
    searchParams.set('page', page);
    searchParams.set('limite', 9);

    // Favoris
    if (params.get('favoris') === '1') {
        const favs = JSON.parse(localStorage.getItem('bw_favoris') || '[]');
        if (favs.length > 0) {
            searchParams.set('ids', favs.join(','));
        } else {
            grid.innerHTML = `
                <div style="grid-column:1/-1; text-align:center; padding:60px;">
                    <p style="font-size:3rem;">💔</p>
                    <p style="color:var(--gris); margin-top:15px;">Vous n'avez pas encore de favoris.</p>
                    <a href="catalogue.html" class="btn btn-primary" style="margin-top:20px;">
                        Parcourir le catalogue
                    </a>
                </div>`;
            countText.textContent = '0 favori';
            document.getElementById('pagination').innerHTML = '';
            return;
        }
    }

    // Recherche textuelle
    const rechercheInput = document.getElementById('search-input');
    const recherche = rechercheInput ? rechercheInput.value.trim() : '';
    if (recherche) searchParams.set('recherche', recherche);

    // Tri
    const triEl = document.getElementById('sort-by');
    if (triEl) searchParams.set('tri', triEl.value);

    // Prix
    const minEl = document.getElementById('price-min');
    const maxEl = document.getElementById('price-max');
    if (minEl && minEl.value) searchParams.set('prix_min', minEl.value);
    if (maxEl && maxEl.value) searchParams.set('prix_max', maxEl.value);

    // Catégories sélectionnées
    const checkedCats = Array.from(document.querySelectorAll('input[name="f-categorie"]:checked')).map(i => i.value);
    if (checkedCats.length > 0) searchParams.set('categorie', checkedCats[0]);

    // Vendeurs sélectionnés
    const checkedVendeurs = Array.from(document.querySelectorAll('input[name="f-vendeur"]:checked')).map(i => i.value);
    if (checkedVendeurs.length > 0) searchParams.set('vendeur_id', checkedVendeurs[0]);

    try {
        const res = await api.get(`/produits?${searchParams.toString()}`);

        // Si la requête a été annulée, ne pas mettre à jour l'UI
        if (!res) return;

        if (!res.ok || !res.data.produits || res.data.produits.length === 0) {
            grid.innerHTML = `
                <div style="grid-column:1/-1; text-align:center; padding:60px 20px;">
                    <div style="font-size:3.5rem; margin-bottom:20px;">🔍</div>
                    <h3 style="color:var(--brun); margin-bottom:10px;">Aucun produit trouvé</h3>
                    <p style="color:var(--gris); margin-bottom:25px;">Essayez d'élargir vos critères de recherche.</p>
                    <button class="btn btn-primary" onclick="resetFiltres()">
                        <i class="fas fa-redo"></i> Réinitialiser les filtres
                    </button>
                </div>
            `;
            countText.textContent = '0 produit trouvé';
            document.getElementById('pagination').innerHTML = '';
            return;
        }

        // Mise à jour du compteur de résultats
        const total = res.data.pagination.total;
        countText.textContent = `${total} produit${total > 1 ? 's' : ''} trouvé${total > 1 ? 's' : ''}`;

        // Injection des cartes produits
        grid.innerHTML = res.data.produits.map(p => carteProduit(p)).join('');

        // Initialiser les boutons favoris
        grid.querySelectorAll('.produit-card-fav').forEach(btn => {
            const id = Number(btn.dataset.id);
            if (typeof initFavoriBtn === 'function') initFavoriBtn(btn, id);
        });

        // Animations scroll
        setTimeout(initScrollReveal, 200);

        // Pagination
        renderPagination(res.data.pagination);

    } catch (err) {
        if (err && err.name === 'AbortError') return; // Requête annulée volontairement
        console.error('Erreur chargement catalogue :', err);
        grid.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:60px 20px;">
                <p style="font-size:3rem;">⚠️</p>
                <p style="color:var(--gris);">Erreur de chargement. Vérifiez que le serveur est actif.</p>
                <button class="btn btn-outline" onclick="chargerProduitsDuCatalogue(1)"
                    style="margin-top:20px; color:var(--brun); border-color:var(--brun);">
                    Réessayer
                </button>
            </div>`;
        countText.textContent = '';
    }
}

// ============================================================
// TEMPLATE HTML D'UNE CARTE PRODUIT
// ============================================================
function carteProduit(p) {
    const imgUrl = api.getImageUrl(p.images);
    const prixFormate = api.formatPrice(p.prix);
    const produitJson = JSON.stringify(p).replace(/'/g, '&apos;').replace(/"/g, '&quot;');

    return `
        <div class="produit-card reveal reveal-up">
            <div class="produit-card-img">
                <img loading="lazy" decoding="async" src="${imgUrl}" alt="${p.nom}"
                     onerror="this.onerror=null;this.src='images/placeholder-pagne.jpg';this.style.objectFit='contain';">
                <button class="produit-card-fav" data-id="${p.id}" onclick="toggleFavori(this, ${p.id})"
                        title="Ajouter aux favoris" aria-label="Favori">
                    <i class="far fa-heart"></i>
                </button>
                ${p.stock <= 5 && p.stock > 0 ? `<span class="badge-stock-faible">⚠️ Stock limité</span>` : ''}
                ${p.stock === 0 ? `<span class="badge-rupture">Rupture</span>` : ''}
            </div>
            <div class="produit-card-body">
                <div class="produit-card-cat">${p.categorie || ''}</div>
                <div class="produit-card-nom">
                    <a href="produit.html?id=${p.id}">${p.nom}</a>
                </div>
                <div class="produit-card-boutique">
                    <i class="fas fa-store" style="color:var(--orange);font-size:0.75rem"></i>
                    ${p.nom_boutique || ''}
                </div>
                <div>${etoilesHTML(p.note_moyenne || 0)}</div>
            </div>
            <div class="produit-card-footer">
                <div class="produit-card-prix">${prixFormate}</div>
                <button class="btn-panier" onclick='ajouterAuPanier(${JSON.stringify(p).replace(/'/g, "&apos;")})'
                        title="Ajouter au panier" ${p.stock === 0 ? 'disabled' : ''}>
                    <i class="fas fa-shopping-bag"></i>
                </button>
            </div>
        </div>
    `;
}

// ============================================================
// PAGINATION
// ============================================================
function renderPagination(pg) {
    const paginContainer = document.getElementById('pagination');
    if (!paginContainer || pg.pages <= 1) {
        if (paginContainer) paginContainer.innerHTML = '';
        return;
    }

    let html = '';

    // Bouton précédent
    if (pg.page > 1) {
        html += `<button class="page-btn" onclick="chargerProduitsDuCatalogue(${pg.page - 1})">
                    <i class="fas fa-chevron-left"></i>
                 </button>`;
    }

    // Numéros de pages (max 5 affichées autour de la page courante)
    const start = Math.max(1, pg.page - 2);
    const end = Math.min(pg.pages, pg.page + 2);

    if (start > 1) html += `<button class="page-btn" onclick="chargerProduitsDuCatalogue(1)">1</button>`;
    if (start > 2) html += `<span class="page-ellipsis">…</span>`;

    for (let i = start; i <= end; i++) {
        html += `<button class="page-btn ${pg.page === i ? 'active' : ''}"
                         onclick="chargerProduitsDuCatalogue(${i})">${i}</button>`;
    }

    if (end < pg.pages - 1) html += `<span class="page-ellipsis">…</span>`;
    if (end < pg.pages) html += `<button class="page-btn" onclick="chargerProduitsDuCatalogue(${pg.pages})">${pg.pages}</button>`;

    // Bouton suivant
    if (pg.page < pg.pages) {
        html += `<button class="page-btn" onclick="chargerProduitsDuCatalogue(${pg.page + 1})">
                    <i class="fas fa-chevron-right"></i>
                 </button>`;
    }

    paginContainer.innerHTML = html;
}

// ============================================================
// GESTION DES FILTRES
// ============================================================

// Debounce : évite les requêtes répétées lors d'une frappe rapide
let debounceTimer = null;
function appliquerFiltres() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        chargerProduitsDuCatalogue(1);
    }, 350); // 350ms de délai
}

function resetFiltres() {
    const minEl = document.getElementById('price-min');
    const maxEl = document.getElementById('price-max');
    const searchEl = document.getElementById('search-input');
    if (minEl) minEl.value = '';
    if (maxEl) maxEl.value = '';
    if (searchEl) searchEl.value = '';
    document.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = false);
    // Supprimer les paramètres URL sans recharger la page
    window.history.replaceState({}, '', 'catalogue.html');
    chargerProduitsDuCatalogue(1);
}

// ============================================================
// BOUTON RETOUR EN HAUT
// ============================================================
function initBoutonHaut() {
    // Créer le bouton si il n'existe pas déjà
    if (document.getElementById('btn-top')) return;

    const btn = document.createElement('button');
    btn.id = 'btn-top';
    btn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    btn.title = 'Retour en haut';
    btn.setAttribute('aria-label', 'Retour en haut de page');
    btn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.appendChild(btn);

    window.addEventListener('scroll', () => {
        btn.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });
}

// Note : Les utilitaires (toggleFavori, ajouterAuPanier, etoilesHTML) résident dans ui.js

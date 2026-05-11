// ============================================================
// BEAUTIFUL WOMEN - Logique Détails Produit (produit.js)
// ============================================================

let currentProduct = null;

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');

    if (!productId) {
        window.location.href = 'catalogue.html';
        return;
    }

    await chargerDetailsProduit(productId);
});

async function chargerDetailsProduit(id) {
    const res = await api.get(`/produits/${id}`);

    if (!res.ok || !res.data.produit) {
        toast('Produit introuvable', 'erreur');
        setTimeout(() => window.location.href = 'catalogue.html', 2000);
        return;
    }

    currentProduct = res.data.produit;
    const p = currentProduct;
    const container = document.getElementById('product-container');

    // Parse images
    let images = [];
    try {
        images = typeof p.images === 'string' ? JSON.parse(p.images) : (p.images || []);
    } catch (e) { images = []; }
    if (images.length === 0) images.push('images/placeholder-pagne.jpg');

    container.innerHTML = `
        <div class="product-gallery reveal reveal-left">
            <div class="main-image">
                <img src="${api.getImageUrl(images[0])}" id="main-img-display" alt="${p.nom}">
            </div>
            <div class="thumbnails">
                ${images.map((img, i) => `
                    <div class="thumbnail ${i === 0 ? 'active' : ''}" onclick="changeMainImage(this, '${api.getImageUrl(img)}')">
                        <img src="${api.getImageUrl(img)}" alt="Aperçu ${i+1}">
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="product-info reveal reveal-right">
            <div class="product-info-header">
                <div class="product-category">${p.categorie}</div>
                <h1 class="product-title">${p.nom}</h1>
                <div class="stars">${etoilesHTML(p.note_moyenne || 0)} <small>(${res.data.avis.length} avis)</small></div>
            </div>

            <div class="product-price">
                ${api.formatPrice(p.prix)}
            </div>

            <div class="product-meta">
                <div><i class="fas fa-check-circle" style="color:var(--vert)"></i> en stock (${p.stock})</div>
                <div><i class="fas fa-eye"></i> ${p.vues || 0} vues</div>
                <div><i class="fas fa-shipping-fast" style="color:var(--or)"></i> Livraison 24-48h</div>
            </div>

            <div class="product-description">
                ${p.description || "Aucune description détaillée pour ce produit."}
            </div>

            <div class="purchase-actions">
                <div class="quantity-selector">
                    <button class="quantity-btn" onclick="updateQty(-1)">-</button>
                    <input type="number" id="buy-qty" class="quantity-input" value="1" min="1" max="${p.stock}">
                    <button class="quantity-btn" onclick="updateQty(1)">+</button>
                </div>
                <button class="btn btn-primary btn-magnetic pulse-hover" onclick="ajouterAuPanierDirect()">
                    <i class="fas fa-shopping-bag"></i> Ajouter au panier
                </button>
                <button class="nav-icon-btn" onclick="toggleFavori(this, ${p.id})" id="fav-btn-prod">
                    <i class="far fa-heart"></i>
                </button>
            </div>

            <!-- Seller Summary -->
            <div class="seller-card-minimal">
                <div class="seller-header">
                    <div class="seller-avatar">
                        ${p.logo_boutique ? `<img src="${api.getImageUrl(p.logo_boutique)}" alt="${p.nom_boutique}">` : '🛍️'}
                    </div>
                    <div class="seller-text">
                        <h4>${p.nom_boutique}</h4>
                        <span class="seller-tag"><i class="fas fa-certificate"></i> Vendeur Certifié</span>
                    </div>
                </div>
                <p class="seller-loc"><i class="fas fa-map-marker-alt"></i> ${p.localisation || 'Abidjan'}</p>
                <a href="catalogue.html?vendeur_id=${p.vendeur_id}" class="seller-link">Voir la boutique</a>
            </div>
        </div>
    `;

    // Initialize fav button
    initFavoriBtn(document.getElementById('fav-btn-prod'), p.id);

    // Charger produits similaires
    await renderSimilaires(res.data.similaires);

    // Initialiser reveal
    setTimeout(initScrollReveal, 400);
}

function changeMainImage(thumb, src) {
    document.getElementById('main-img-display').src = src;
    document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
    thumb.classList.add('active');
}

function updateQty(delta) {
    const input = document.getElementById('buy-qty');
    let val = parseInt(input.value) + delta;
    if (val < 1) val = 1;
    if (val > currentProduct.stock) val = currentProduct.stock;
    input.value = val;
}

function ajouterAuPanierDirect() {
    const qty = parseInt(document.getElementById('buy-qty').value);
    panier.ajouter(currentProduct, qty);
}

function renderSimilaires(similaires) {
    const grid = document.getElementById('related-products');
    if (!similaires || similaires.length === 0) {
        grid.innerHTML = '<p style="color:var(--gris)">Aucun produit similaire trouvé.</p>';
        return;
    }

    grid.innerHTML = similaires.map(p => `
        <div class="produit-card reveal reveal-up">
            <div class="produit-card-img">
                <img src="${api.getImageUrl(p.images)}" alt="${p.nom}" onerror="this.src='images/placeholder-pagne.jpg'">
            </div>
            <div class="produit-card-body">
                <div class="produit-card-nom">
                    <a href="produit.html?id=${p.id}">${p.nom}</a>
                </div>
                <div class="stars">${etoilesHTML(p.note_moyenne || 0)}</div>
                <div class="produit-card-prix" style="margin-top:10px">${api.formatPrice(p.prix)}</div>
            </div>
        </div>
    `).join('');
}



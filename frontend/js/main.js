// ============================================================
// BEAUTIFUL WOMEN - Logique Page d'Accueil (main.js)
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log("🚀 Initialisation de la page d'accueil...");
    // Initialiser l'observateur de reveal
    initScrollReveal();

    try {
        // Charger les données en parallèle
        await Promise.all([
            chargerCategories(),
            chargerTendances(),
            chargerVendeurs()
        ]);
        console.log("✅ Données chargées avec succès.");
    } catch (error) {
        console.error("❌ Erreur lors du chargement des données :", error);
    }

    // Relancer le reveal après chargement dynamique
    setTimeout(() => {
        console.log("✨ Finalisation du reveal...");
        initScrollReveal();
    }, 800);
});

/** Système de Reveal au Scroll (Déplacé dans ui.js) */

// ============================================================
// CATÉGORIES
// ============================================================
async function chargerCategories() {
    const grid = document.getElementById('categories-grid');
    if (!grid) return;

    console.log("📥 Chargement des catégories...");
    const res = await api.get('/categories');

    if (!res.ok || !res.data.categories) {
        // Fallback statique si l'API n'est pas disponible
        const fallback = [
            { nom: 'Wax', slug: 'wax', icone: '🌸', nb_produits: '—' },
            { nom: 'Bazin', slug: 'bazin', icone: '✨', nb_produits: '—' },
            { nom: 'Kente', slug: 'kente', icone: '👑', nb_produits: '—' },
            { nom: 'Bogolan', slug: 'bogolan', icone: '🎨', nb_produits: '—' },
            { nom: 'Kita', slug: 'kita', icone: '🌿', nb_produits: '—' },
            { nom: 'Ankara', slug: 'ankara', icone: '🦋', nb_produits: '—' },
        ];
        grid.innerHTML = fallback.map(c => carteCategorie(c)).join('');
        return;
    }

    grid.innerHTML = res.data.categories.map(c => carteCategorie(c)).join('');
}

function carteCategorie(cat) {
    return `
        <div class="categorie-card reveal reveal-zoom" onclick="window.location='catalogue.html?categorie=${cat.slug}'">
            <span class="cat-icon">${cat.icone || '🧵'}</span>
            <span class="cat-nom">${cat.nom}</span>
            <span class="cat-nb">${cat.nb_produits || 0} produits</span>
        </div>
    `;
}

// ============================================================
// PRODUITS EN TENDANCE
// ============================================================

// Images locales de pagnes africains authentiques (plus besoin d'internet)
const TENDANCES_AFRICAINES = [
    {
        id: 's1', nom: 'Grand Boubou Wax Ankara',
        categorie: 'Wax', prix: 18500, note_moyenne: 4.8,
        nom_boutique: 'Boutique Adjoua',
        images: ['images/wax-ankara.jpg']
    },
    {
        id: 's2', nom: 'Robe Kabba Bazin Brodée',
        categorie: 'Bazin', prix: 25000, note_moyenne: 4.9,
        nom_boutique: 'Mode Africaine CI',
        images: ['images/bazin-brodee.jpg']
    },
    {
        id: 's3', nom: 'Tissu Kente Royal 6 Yards',
        categorie: 'Kente', prix: 32000, note_moyenne: 5.0,
        nom_boutique: 'Kente Palace',
        images: ['images/kente-royal.jpg']
    },
    {
        id: 's4', nom: 'Ensemble Pagne Bogolan Mali',
        categorie: 'Bogolan', prix: 15000, note_moyenne: 4.7,
        nom_boutique: 'Art Bogolan',
        images: ['images/bogolan-mali.jpg']
    },
    {
        id: 's5', nom: 'Wax Hollandais Imprimé 6m',
        categorie: 'Wax', prix: 22000, note_moyenne: 4.6,
        nom_boutique: 'Tissu Adjamé Premium',
        images: ['images/wax-hollandais.jpg']
    },
    {
        id: 's6', nom: 'Bazin Bleu Royal Brodé',
        categorie: 'Bazin', prix: 28000, note_moyenne: 4.9,
        nom_boutique: 'Bella Couture',
        images: ['images/bazin-brodee.jpg']
    }
];

async function chargerTendances() {
    const grid = document.getElementById('tendances-grid');
    if (!grid) return;

    console.log("📥 Chargement des tendances...");
    const res = await api.get('/produits/tendances');

    // Si l'API retourne des produits, les afficher
    if (res.ok && res.data.produits && res.data.produits.length > 0) {
        grid.innerHTML = res.data.produits.map(p => carteProduit(p)).join('');
        return;
    }

    // Sinon, afficher les tendances africaines statiques
    console.log("ℹ️ Aucune tendance en base, affichage des modèles africains statiques.");
    grid.innerHTML = TENDANCES_AFRICAINES.map(p => carteProduitStatic(p)).join('');
}

function carteProduitStatic(p) {
    const imageSrc = p.images[0];
    const etoiles = etoilesHTML(p.note_moyenne || 0);
    const prix = api.formatPrice(p.prix);

    return `
        <div class="produit-card reveal reveal-up">
            <div class="produit-card-img">
                <img src="${imageSrc}" alt="${p.nom}"
                     onerror="this.onerror=null; this.src='images/placeholder-pagne.jpg';"
                     loading="lazy" />
                <span class="produit-card-badge">Tendance 🔥</span>
                <button class="produit-card-fav" title="Ajouter aux favoris">
                    <i class="far fa-heart"></i>
                </button>
            </div>
            <div class="produit-card-body">
                <div class="produit-card-cat">${p.categorie}</div>
                <div class="produit-card-nom">
                    <a href="catalogue.html">${p.nom}</a>
                </div>
                <div class="produit-card-boutique">
                    <i class="fas fa-store" style="color:var(--orange);font-size:0.7rem"></i> ${p.nom_boutique}
                </div>
                <div class="stars">${etoiles} <small style="color:var(--gris)">(${Number(p.note_moyenne || 0).toFixed(1)})</small></div>
            </div>
            <div class="produit-card-footer">
                <div class="produit-card-prix">
                    ${prix}
                </div>
                <a href="catalogue.html" class="btn-panier" title="Voir le catalogue">
                    <i class="fas fa-shopping-bag"></i>
                </a>
            </div>
        </div>
    `;
}

function carteProduit(p) {
    // Parser les images (JSON string, tableau ou chaine simple)
    let path = null;
    try {
        if (!p.images) {
            path = null;
        } else if (typeof p.images === 'string' && (p.images.startsWith('[') || p.images.startsWith('{'))) {
            const arr = JSON.parse(p.images);
            path = Array.isArray(arr) ? arr[0] : arr;
        } else if (Array.isArray(p.images)) {
            path = p.images[0];
        } else {
            path = p.images; // Chaine simple
        }
    } catch (e) {
        path = null;
    }

    const imageSrc = api.getImageUrl(path);
    const etoiles = etoilesHTML(p.note_moyenne || 0);
    const prix = api.formatPrice(p.prix);

    return `
        <div class="produit-card reveal reveal-up">
            <div class="produit-card-img">
                <img src="${imageSrc}" alt="${p.nom}"
                     onerror="this.onerror=null; this.src='images/placeholder-pagne.jpg';"
                     loading="lazy" />
                <span class="produit-card-badge">Tendance 🔥</span>
                <button class="produit-card-fav" onclick="toggleFavori(this, ${p.id})" title="Ajouter aux favoris">
                    <i class="far fa-heart"></i>
                </button>
            </div>
            <div class="produit-card-body">
                <div class="produit-card-cat">${p.categorie || ''}</div>
                <div class="produit-card-nom">
                    <a href="produit.html?id=${p.id}">${p.nom}</a>
                </div>
                <div class="produit-card-boutique">
                    <i class="fas fa-store" style="color:var(--orange);font-size:0.7rem"></i> ${p.nom_boutique || ''}
                </div>
                <div class="stars">${etoiles} <small style="color:var(--gris)">(${p.note_moyenne ? Number(p.note_moyenne).toFixed(1) : 'Nouveau'})</small></div>
            </div>
            <div class="produit-card-footer">
                <div class="produit-card-prix">
                    ${prix}
                </div>
                <button class="btn-panier" onclick="ajouterAuPanier(${JSON.stringify(p).replace(/"/g, '&quot;')})" title="Ajouter au panier">
                    <i class="fas fa-shopping-bag"></i>
                </button>
            </div>
        </div>
    `;
}

// ============================================================
// VENDEURS VEDETTES
// ============================================================
async function chargerVendeurs() {
    const grid = document.getElementById('vendeurs-grid');
    if (!grid) return;

    console.log("📥 Chargement des vendeurs...");
    const res = await api.get('/vendeurs');

    if (!res.ok || !res.data.vendeurs || res.data.vendeurs.length === 0) {
        grid.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:40px; color:var(--gris);">
                <p>Nos vendeuses arrivent bientôt !</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = res.data.vendeurs.map(v => carteVendeur(v)).join('');
}

function carteVendeur(v) {
    const etoiles = etoilesHTML(v.note_moyenne || 0);
    return `
        <div class="vendeur-card reveal reveal-up" onclick="window.location='vendeur.html?id=${v.id}'" style="cursor:pointer">
            <div class="vendeur-card-banniere" style="background:linear-gradient(135deg, var(--vert), #1b4332);">
                <div class="vendeur-card-logo">
                    ${v.logo ? `<img src="${api.getImageUrl(v.logo)}" alt="${v.nom_boutique}" style="width:100%;height:100%;object-fit:cover;border-radius:50%"/>` : '🛍️'}
                </div>
            </div>
            <div class="vendeur-card-body">
                <div class="vendeur-card-nom">${v.nom_boutique}</div>
                <div class="vendeur-card-loc"><i class="fas fa-map-marker-alt" style="color:var(--orange)"></i> ${v.localisation || 'Abidjan'}</div>
                <div class="stars" style="margin-bottom:10px">${etoiles}</div>
                <div class="vendeur-card-stats">
                    <span><strong>${v.nb_produits}</strong> produits</span>
                    <span><strong>${v.note_moyenne ? parseFloat(v.note_moyenne).toFixed(1) : 'Nouveau'}</strong> ⭐</span>
                </div>
            </div>
        </div>
    `;
}

// Exposer globalement
// (Certaines fonctions sont maintenant dans ui.js)

// ============================================================
// BEAUTIFUL WOMEN - Logique Page Modèles (modeles.js)
// ============================================================

// ➡️ Modèles 100% Africains Authentiques — images locales (pas de CDN externe)
const MODELES_AFRICAINS = [
    {
        id: 'm1',
        nom: 'Grand Boubou Complet Bazin Brodé',
        categorie: 'Bazin',
        badge: 'Best-seller',
        prix: 45000,
        description: 'Élégant grand boubou en Bazin riche avec broderies dorées sur le col et les manches. Coupe ample traditionnelle, parfait pour les cérémonies et fêtes.',
        image: 'images/bazin-brodee.jpg'
    },
    {
        id: 'm2',
        nom: 'Kaftan Wax Ankara Deux Pièces',
        categorie: 'Wax',
        badge: 'Tendance',
        prix: 28000,
        description: 'Ensemble deux pièces en tissu Wax Ankara aux couleurs vives. Haut asymétrique et jupe longue fendue. Idéal pour les sorties et les événements.',
        image: 'images/wax-ankara.jpg'
    },
    {
        id: 'm3',
        nom: 'Robe Kabba Bogolan Traditionnel',
        categorie: 'Bogolan',
        badge: 'Artisanal',
        prix: 22000,
        description: 'Robe Kabba confectionnée en Bogolan du Mali avec des motifs géométriques traditionnels. Teint naturellement à base de plantes et d\'argile ferrugineuse.',
        image: 'images/bogolan-mali.jpg'
    },
    {
        id: 'm4',
        nom: 'Robe Longue Kente Ghana-Côte d\'Ivoire',
        categorie: 'Kente',
        badge: 'Exclusif',
        prix: 55000,
        description: 'Robe longue tissée à la main en Kente authentique, avec des bandes multicolores en rouge, or, vert et noir. Tissu royal porté pour les grandes occasions.',
        image: 'images/kente-royal.jpg'
    },
    {
        id: 'm5',
        nom: 'Ensemble Pagne Wax Imprimé Festif',
        categorie: 'Wax',
        badge: 'Nouveau',
        prix: 18000,
        description: 'Ensemble coordonné en pagne Wax imprimé aux motifs floraux et géométriques africains. Haut à col Mao et jupe portefeuille jusqu\'aux genoux.',
        image: 'images/wax-hollandais.jpg'
    },
    {
        id: 'm6',
        nom: 'Boubou Djellaba Africaine Unisexe',
        categorie: 'Bazin',
        badge: 'Populaire',
        prix: 35000,
        description: 'Boubou djellaba en tissu Bazin blanc avec broderies traditionnelles sur le devant. Coupe fluide et ample pour un confort maximal sous la chaleur.',
        image: 'images/bazin-brodee.jpg'
    },
    {
        id: 'm7',
        nom: 'Robe de Mariée Wax Africain',
        categorie: 'Wax',
        badge: 'Cérémonie',
        prix: 75000,
        description: 'Sublime robe de mariée en Wax premium avec corsage ajusté et jupe évasée. Motifs de roses africaines en orange et blanc doré. Livraison avec voile traditionnel.',
        image: 'images/wax-ankara.jpg'
    },
    {
        id: 'm8',
        nom: 'Combinaison Palazzo Kente Moderne',
        categorie: 'Kente',
        badge: 'Tendance',
        prix: 32000,
        description: 'Combinaison palazzo en tissu Kente revu avec une coupe moderne. Pantalon large, haut bustier assorti. Mélange parfait entre tradition et modernité.',
        image: 'images/kente-royal.jpg'
    }
];

document.addEventListener('DOMContentLoaded', async () => {
    initScrollReveal && initScrollReveal();
    await chargerModeles();
});

async function chargerModeles() {
    const grid = document.getElementById('models-grid');
    if (!grid) return;

    // Essayer de charger depuis l'API
    const res = await api.get('/produits?categorie=couture-modeles');

    if (res.ok && res.data.produits && res.data.produits.length > 0) {
        // Afficher les modèles depuis la base de données
        grid.innerHTML = res.data.produits.map(p => {
            let images = [];
            try { images = typeof p.images === 'string' ? JSON.parse(p.images) : (p.images || []); }
            catch (e) { images = []; }
            const imageSrc = api.getImageUrl(images[0]);

            return `
                <div class="model-card reveal reveal-up">
                    <div class="model-img">
                        <img src="${imageSrc}" alt="${p.nom}" onerror="this.src='images/placeholder-pagne.jpg'">
                        <span class="model-badge">Couture Artisanale</span>
                    </div>
                    <div class="model-content">
                        <h3 class="model-title">${p.nom}</h3>
                        <p class="model-desc">${p.description || ''}</p>
                        <div class="model-footer">
                            <div class="model-price">${api.formatPrice(p.prix)}</div>
                            <button class="btn btn-primary btn-magnetic" onclick='ajouterAuPanier(${JSON.stringify(p).replace(/'/g, "&apos;")})'>
                                Commander
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } else {
        // Afficher les modèles africains statiques
        console.log("ℹ️ Affichage des modèles africains authentiques statiques.");
        grid.innerHTML = MODELES_AFRICAINS.map(m => carteModeleAfricain(m)).join('');
    }

    setTimeout(initScrollReveal, 400);
}

function carteModeleAfricain(m) {
    const prix = api.formatPrice(m.prix);
    return `
        <div class="model-card reveal reveal-up">
            <div class="model-img">
                <img src="${m.image}" alt="${m.nom}"
                     onerror="this.onerror=null; this.src='images/placeholder-pagne.jpg';"
                     loading="lazy">
                <span class="model-badge">${m.badge} ✨</span>
            </div>
            <div class="model-content">
                <div style="display:inline-block; background:var(--or-light,#fff3cd); color:var(--brun); font-size:0.72rem; font-weight:600; padding:3px 10px; border-radius:20px; margin-bottom:10px;">
                    ${m.categorie}
                </div>
                <h3 class="model-title">${m.nom}</h3>
                <p class="model-desc">${m.description}</p>
                <div class="model-footer">
                    <div class="model-price">${prix}</div>
                    <a href="catalogue.html" class="btn btn-primary btn-magnetic" style="font-size:0.8rem; padding:8px 16px;">
                        <i class="fas fa-shopping-bag"></i> Commander
                    </a>
                </div>
            </div>
        </div>
    `;
}

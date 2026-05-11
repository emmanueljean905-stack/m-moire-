// ============================================================
// BEAUTIFUL WOMEN - Logique Dashboard Vendeur (vendeur-dashboard.js)
// ============================================================

let currentVendor = null;
let sellerProducts = [];
let sellerOrders = [];

document.addEventListener('DOMContentLoaded', async () => {
    // Auth Guard : Vendeur uniquement
    if (!session.estConnecte() || session.getUser().role !== 'vendeur') {
        toast('Accès réservé aux vendeurs', 'erreur');
        setTimeout(() => window.location.href = 'auth.html', 1500);
        return;
    }

    // Charger les données initiales
    await chargerDonneesDashboard();
    await chargerCategoriesProduit();
});

/** Charger toutes les données du dashboard */
async function chargerDonneesDashboard() {
    const res = await api.get('/vendeurs/dashboard');
    if (res.ok) {
        const { stats, commandes, stockFaible } = res.data;
        
        // Stats
        document.getElementById('stat-revenu').textContent = api.formatPrice(stats.chiffre_affaires);
        document.getElementById('stat-ventes').textContent = stats.total_commandes;
        document.getElementById('stat-produits').textContent = stats.total_produits;

        // Info Boutique (Sidebar + Navbar)
        const userProfil = await api.get('/auth/profil');
        if (userProfil.ok) {
            currentVendor = userProfil.data.utilisateur;
            
            // Sidebar
            document.getElementById('vendor-store-name').textContent = currentVendor.nom_boutique;
            document.getElementById('vendor-owner-name').textContent = currentVendor.nom;
            
            // Sidebar Logo Premium
            const logoImg = document.getElementById('sidebar-vendor-logo');
            const logoIcon = document.getElementById('sidebar-vendor-icon');
            if (currentVendor.logo) {
                logoImg.src = getImageUrl(currentVendor.logo);
                logoImg.style.display = 'block';
                logoIcon.style.display = 'none';
            } else {
                logoImg.style.display = 'none';
                logoIcon.style.display = 'block';
            }
            
            // Navbar Badge
            document.getElementById('nav-user-name').textContent = currentVendor.nom;
            const initials = currentVendor.nom.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            document.getElementById('nav-user-initials').textContent = initials;

            // Message de bienvenue
            document.getElementById('welcome-message').innerHTML = `Ravi de vous revoir, <span style="color:var(--orange)">${currentVendor.nom.split(' ')[0]}</span> ! 👋`;
            
            // Date du jour
            const dateStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            document.getElementById('current-date-display').innerHTML = `<i class="fas fa-calendar-alt" style="margin-right:8px; color:var(--orange);"></i> ${dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}`;
            
            // Pré-remplir les réglages
            document.getElementById('set-boutique').value = currentVendor.nom_boutique;
            document.getElementById('set-loc').value = currentVendor.localisation || '';
            document.getElementById('set-desc').value = currentVendor.description || '';
            
            // Images de la boutique
            document.getElementById('set-logo-url').value = currentVendor.logo || '';
            document.getElementById('set-banner-url').value = currentVendor.banniere || '';
            
            if (currentVendor.logo) {
                document.getElementById('logo-preview-container').innerHTML = `<img src="${getImageUrl(currentVendor.logo)}">`;
            }
            if (currentVendor.banniere) {
                document.getElementById('banner-preview-container').innerHTML = `<img src="${getImageUrl(currentVendor.banniere)}">`;
            }
        }

        // Listes
        renderRecentOrders(commandes);
        await chargerListeProduits();
    }
}

/** Changer de section (Tabs) */
function switchSection(id, btn) {
    document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');
    document.getElementById('sec-' + id).style.display = 'block';

    document.querySelectorAll('.sidebar-btn').forEach(i => i.classList.remove('active'));
    btn.classList.add('active');
}

// ============================================================
// GESTION DES PRODUITS
// ============================================================

/** Charger la liste complète des produits du vendeur */
async function chargerListeProduits() {
    const res = await api.get(`/produits?vendeur_id=${session.getUser().vendeur_id}&limite=50`);
    const container = document.getElementById('products-list-table');

    if (res.ok && res.data.produits) {
        sellerProducts = res.data.produits;
        
        if (sellerProducts.length === 0) {
            container.innerHTML = `
                <div class="empty-state reveal reveal-up">
                    <div class="empty-state-icon">
                        <i class="fas fa-tshirt"></i>
                    </div>
                    <h3>Aucun produit pour l'instant</h3>
                    <p>Commencez à remplir votre boutique en ajoutant vos plus beaux pagnes pour les proposer à nos clientes.</p>
                    <button class="btn btn-primary pulse-hover" onclick="ouvrirModalProduit()">
                        <i class="fas fa-plus"></i> Ajouter mon premier pagne
                    </button>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <table class="order-table">
                <thead>
                    <tr>
                        <th>Image</th>
                        <th>Nom</th>
                        <th>Prix</th>
                        <th>Stock</th>
                        <th>Catégorie</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${sellerProducts.map(p => `
                        <tr class="reveal-up">
                            <td>
                                <div style="position:relative; width:60px; height:60px;">
                                    <img loading="lazy" src="${api.getImageUrl(p.images)}" style="width:100%; height:100%; border-radius:12px; object-fit:cover; box-shadow:var(--shadow);">
                                    ${p.stock <= 5 ? '<div style="position:absolute; top:-5px; right:-5px; width:12px; height:12px; background:var(--rouge); border:2px solid var(--blanc); border-radius:50%;"></div>' : ''}
                                </div>
                            </td>
                            <td>
                                <div style="display:flex; flex-direction:column;">
                                    <span style="font-weight:700; color:var(--brun);">${p.nom}</span>
                                    <small style="font-size:0.7rem; color:var(--gris); text-transform:uppercase;">ID: #P-${p.id}</small>
                                </div>
                            </td>
                            <td><span style="font-weight:700; color:var(--orange);">${api.formatPrice(p.prix)}</span></td>
                            <td>
                                <span class="badge" style="background:${p.stock <= 5 ? 'rgba(235,64,52,0.1)' : 'rgba(46,204,113,0.1)'}; color:${p.stock <= 5 ? 'var(--rouge)' : 'var(--vert)'}; padding:5px 12px; border-radius:20px; font-weight:600; font-size:0.8rem;">
                                    ${p.stock} en stock
                                </span>
                            </td>
                            <td><span style="color:var(--brun); opacity:0.7; font-weight:500;">${p.categorie}</span></td>
                            <td>
                                <div class="action-btns">
                                    <button class="btn" onclick="ouvrirModalProduit(${p.id})" style="background:var(--gris-l); color:var(--brun); padding:8px 12px; border-radius:10px;" title="Modifier">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn" onclick="supprimerProduit(${p.id})" style="background:rgba(235,64,52,0.1); color:var(--rouge); padding:8px 12px; border-radius:10px;" title="Supprimer">
                                        <i class="fas fa-trash-alt"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }
}

/** Modal Produit */
async function chargerCategoriesProduit() {
    const res = await api.get('/categories');
    if (res.ok) {
        document.getElementById('prod-cat').innerHTML = res.data.categories.map(c => 
            `<option value="${c.id}">${c.nom}</option>`
        ).join('');
    }
}

function ouvrirModalProduit(id = null) {
    const modal = document.getElementById('modal-produit');
    const form = document.getElementById('form-produit');
    const title = document.getElementById('modal-title');
    
    form.reset();
    document.getElementById('prod-id').value = '';
    document.getElementById('prod-file').value = '';

    if (id) {
        const p = sellerProducts.find(prod => prod.id === id);
        if (p) {
            title.textContent = 'Modifier le produit';
            document.getElementById('prod-id').value = p.id;
            document.getElementById('prod-nom').value = p.nom;
            document.getElementById('prod-prix').value = p.prix;
            document.getElementById('prod-stock').value = p.stock;
            document.getElementById('prod-cat').value = p.id_categorie; // On espère que id_categorie est là, sinon on adapte le backend
            document.getElementById('prod-desc').value = p.description || '';
            const imgUrl = api.getImageUrl(p.images);
            document.getElementById('prod-img').value = imgUrl;
            document.getElementById('prod-img-preview').innerHTML = `<img src="${imgUrl}" style="width:100%; height:100%; object-fit:cover;">`;
        }
    } else {
        title.textContent = 'Ajouter un nouveau pagne';
        document.getElementById('prod-img-preview').innerHTML = '<i class="fas fa-image" style="opacity:0.3"></i>';
    }

    modal.style.display = 'flex';
}

function fermerModalProduit() {
    document.getElementById('modal-produit').style.display = 'none';
}

/** Submit (Créer ou Modifier) */
async function handleSubmitProduit(e) {
    e.preventDefault();
    const id = document.getElementById('prod-id').value;
    const btn = document.getElementById('btn-submit-prod');
    const fileInput = document.getElementById('prod-file');
    
    btn.disabled = true;
    btn.textContent = 'Patientez...';

    let imageUrl = document.getElementById('prod-img').value;

    // 1. Si un nouveau fichier est sélectionné, on l'uploade d'abord
    if (fileInput.files && fileInput.files[0]) {
        const formData = new FormData();
        formData.append('image', fileInput.files[0]);
        
        const uploadRes = await api.post('/upload', formData);
        if (uploadRes.ok) {
            imageUrl = uploadRes.data.url;
        } else {
            toast('Erreur lors de l\'upload de l\'image', 'erreur');
            btn.disabled = false;
            btn.textContent = 'Enregistrer le produit';
            return;
        }
    }

    const data = {
        nom: document.getElementById('prod-nom').value,
        prix: parseFloat(document.getElementById('prod-prix').value),
        stock: parseInt(document.getElementById('prod-stock').value),
        id_categorie: parseInt(document.getElementById('prod-cat').value),
        description: document.getElementById('prod-desc').value,
        images: imageUrl ? [imageUrl] : []
    };

    const res = id ? await api.put(`/produits/${id}`, data) : await api.post('/produits', data);

    if (res.ok) {
        toast(id ? 'Produit mis à jour !' : 'Produit ajouté avec succès !');
        fermerModalProduit();
        chargerDonneesDashboard(); // Rafraîchir tout
    } else {
        toast(res.data.message || 'Une erreur est survenue', 'erreur');
    }

    btn.disabled = false;
    btn.textContent = 'Enregistrer le produit';
}

/** Preview Image */
function previewImage(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('prod-img-preview').innerHTML = `<img src="${e.target.result}" style="width:100%; height:100%; object-fit:cover;">`;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

async function supprimerProduit(id) {
    if (confirm('Voulez-vous vraiment supprimer ce produit ?')) {
        const res = await api.delete(`/produits/${id}`);
        if (res.ok) {
            toast('Produit supprimé');
            chargerDonneesDashboard();
        }
    }
}

// ============================================================
// GESTION DES COMMANDES
// ============================================================

function renderRecentOrders(commandes) {
    const container = document.getElementById('recent-orders-list');
    
    if (!commandes || commandes.length === 0) {
        container.innerHTML = '<p style="color:var(--gris)">Aucune commande pour le moment.</p>';
        return;
    }

    container.innerHTML = `
        <table class="order-table">
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Date</th>
                    <th>Acheteur</th>
                    <th>Montant Total</th>
                    <th>Statut</th>
                </tr>
            </thead>
            <tbody>
                ${commandes.map(c => `
                    <tr class="reveal-up">
                        <td style="font-weight:700; color:var(--brun);">#BW-${c.id}</td>
                        <td><span style="color:var(--gris); font-size:0.85rem;">${new Date(c.created_at).toLocaleDateString()}</span></td>
                        <td style="font-weight:600;">${c.acheteur}</td>
                        <td style="font-weight:700; color:var(--orange);">${api.formatPrice(c.montant_total)}</td>
                        <td><span class="status-badge status-${c.statut}" style="padding:6px 15px; border-radius:20px; font-size:0.75rem; font-weight:700; text-transform:uppercase;">${c.statut}</span></td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    // Remplir aussi l'onglet "Mes Commandes" complet
    const fullContainer = document.getElementById('full-orders-list');
    if (!fullContainer) return;

    fullContainer.innerHTML = `
        <table class="order-table">
            <thead>
                <tr>
                    <th>Commande</th>
                    <th>Date</th>
                    <th>Acheteur</th>
                    <th>Adresse</th>
                    <th>Action</th>
                </tr>
            </thead>
            <tbody>
                ${commandes.map(c => `
                    <tr>
                        <td><strong>#BW-${c.id}</strong><br><small>${api.formatPrice(c.montant_total)}</small></td>
                        <td>${new Date(c.created_at).toLocaleDateString()}</td>
                        <td>${c.acheteur}</td>
                        <td style="max-width:200px; font-size:0.85rem;">
                            <div style="font-weight:600; color:var(--brun);">${c.zone_nom || 'Zone non spécifiée'}</div>
                            <div style="color:var(--gris); margin-top:2px;">${c.adresse_liv}</div>
                            <div style="font-size:0.75rem; color:var(--orange); font-weight:700; margin-top:4px;">Livraison: ${api.formatPrice(c.frais_livraison)}</div>
                        </td>
                        <td>
                            <div style="display:flex; flex-direction:column; gap:5px;">
                                <select onchange="updateOrderStatus(${c.id}, this.value)" class="sort-select" style="padding:6px; font-size:0.8rem;">
                                    <option value="en_attente" ${c.statut === 'en_attente' ? 'selected' : ''}>En attente</option>
                                    <option value="payee" ${c.statut === 'payee' ? 'selected' : ''}>Payée</option>
                                    <option value="en_livraison" ${c.statut === 'en_livraison' ? 'selected' : ''}>En livraison</option>
                                    <option value="livree" ${c.statut === 'livree' ? 'selected' : ''}>Livrée</option>
                                    <option value="annulee" ${c.statut === 'annulee' ? 'selected' : ''}>Annulée</option>
                                </select>
                                ${c.statut === 'en_livraison' ? `
                                    <button onclick="lancerSimulationLivraison(${c.id})" class="btn btn-outline" style="padding:4px 8px; font-size:0.7rem; border-color:var(--orange); color:var(--orange);">
                                        <i class="fas fa-play"></i> Simuler
                                    </button>
                                ` : ''}
                            </div>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function updateOrderStatus(id, newStatus) {
    const res = await api.put(`/commandes/${id}/statut`, { statut: newStatus });
    if (res.ok) {
        toast('Statut mis à jour !');
        chargerDonneesDashboard();
    } else {
        toast('Erreur lors de la mise à jour', 'erreur');
    }
}

// ============================================================
// RÉGLAGES BOUTIQUE
// ============================================================

async function handleUpdateProfile(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-save-settings');
    const originalText = btn.innerHTML;
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enregistrement...';

    let logoUrl = document.getElementById('set-logo-url').value;
    let bannerUrl = document.getElementById('set-banner-url').value;

    const logoFile = document.getElementById('set-logo-file').files[0];
    const bannerFile = document.getElementById('set-banner-file').files[0];

    // 1. Upload Logo si présent
    if (logoFile) {
        const formData = new FormData();
        formData.append('image', logoFile);
        const res = await api.post('/upload', formData);
        if (res.ok) logoUrl = res.data.url;
    }

    // 2. Upload Bannière si présent
    if (bannerFile) {
        const formData = new FormData();
        formData.append('image', bannerFile);
        const res = await api.post('/upload', formData);
        if (res.ok) bannerUrl = res.data.url;
    }

    const data = {
        nom_boutique: document.getElementById('set-boutique').value,
        localisation: document.getElementById('set-loc').value,
        description: document.getElementById('set-desc').value,
        logo: logoUrl,
        banniere: bannerUrl
    };

    const res = await api.put('/vendeurs/mon-profil', data);
    if (res.ok) {
        toast('Profil boutique mis à jour ✨');
        chargerDonneesDashboard();
    } else {
        toast('Erreur lors de la mise à jour', 'erreur');
    }

    btn.disabled = false;
    btn.innerHTML = originalText;
}

/** Preview Settings Image */
function previewSettingImage(input, type) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const containerId = type === 'logo' ? 'logo-preview-container' : 'banner-preview-container';
            document.getElementById(containerId).innerHTML = `<img src="${e.target.result}">`;
        };
        reader.readAsDataURL(input.files[0]);
    }
}



/** Lancer la simulation de suivi (pour la soutenance) */
function lancerSimulationLivraison(id) {
    toast('Simulation lancée ! Suivi activé pour le client.', 'succes');
    
    const etapes = [
        { status: 'Prise en charge', desc: 'Le livreur a récupéré votre colis.', progress: 25 },
        { status: 'En transit', desc: 'Votre colis est en route vers le centre de tri.', progress: 50 },
        { status: 'Proche de vous', desc: 'Le livreur est dans votre quartier !', progress: 75 },
        { status: 'Livré', desc: 'Votre pagne a été livré avec succès.', progress: 100 }
    ];

    let i = 0;
    const interval = setInterval(() => {
        if (i >= etapes.length) {
            clearInterval(interval);
            updateOrderStatus(id, 'livree'); // Marquer comme livré à la fin
            return;
        }

        const data = {
            orderId: id,
            currentStep: etapes[i],
            timestamp: new Date().toLocaleTimeString()
        };
        
        // Stockage pour que profil.html puisse lire (Simule un WebSocket/Push)
        localStorage.setItem(`tracking_bw_${id}`, JSON.stringify(data));
        
        // Notification pour le vendeur
        console.log(`[SIMULATION] Commande #${id} : ${etapes[i].status}`);
        
        i++;
    }, 5000); // 5 secondes par étape
}

// Export global pour HTML
window.lancerSimulationLivraison = lancerSimulationLivraison;
window.switchSection = switchSection;
window.ouvrirModalProduit = ouvrirModalProduit;
window.fermerModalProduit = fermerModalProduit;
window.handleSubmitProduit = handleSubmitProduit;
window.supprimerProduit = supprimerProduit;
window.updateOrderStatus = updateOrderStatus;
window.handleUpdateProfile = handleUpdateProfile;
window.previewImage = previewImage;
window.previewSettingImage = previewSettingImage;

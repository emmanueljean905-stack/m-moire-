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

async function chargerDonneesDashboard() {
    const res = await api.get('/vendeurs/dashboard');
    if (!res || !res.ok) {
        toast('Impossible de charger le tableau de bord. Vérifiez votre connexion.', 'erreur');
        return;
    }

    const { stats, commandes, stockFaible, valide } = res.data;
    
    // Affichage du bandeau de validation
    const bannerContainer = document.getElementById('validation-warning-banner');
    if (bannerContainer) {
        if (valide !== 1) {
            bannerContainer.innerHTML = `
                <div style="background: rgba(239, 68, 68, 0.08); border-left: 5px solid #ef4444; padding: 18px 24px; border-radius: 16px; margin-bottom: 25px; display: flex; align-items: center; gap: 15px; box-shadow: var(--shadow); animation: slideUp 0.4s ease;">
                    <div style="width: 45px; height: 45px; background: rgba(239, 68, 68, 0.15); border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #ef4444; flex-shrink: 0;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 1.3rem;"></i>
                    </div>
                    <div>
                        <h4 style="margin: 0 0 4px; color: #b91c1c; font-weight: 700; font-size: 0.95rem;">Compte en attente de validation</h4>
                        <p style="margin: 0; color: #7f1d1d; font-size: 0.85rem; line-height: 1.4;">Votre compte boutique n'est pas encore validé. Vos produits ne sont pas visibles et vous ne pouvez pas ajouter de nouveaux articles pour le moment.</p>
                    </div>
                </div>
            `;
        } else {
            bannerContainer.innerHTML = '';
        }
    }
    
    // Stats KPI
    const elRevenu = document.getElementById('stat-revenu');
    const elVentes = document.getElementById('stat-ventes');
    const elProduits = document.getElementById('stat-produits');
    if (elRevenu) elRevenu.textContent = api.formatPrice(stats.chiffre_affaires || 0);
    if (elVentes) elVentes.textContent = stats.total_commandes || 0;
    if (elProduits) elProduits.textContent = stats.total_produits || 0;

    // Alerte stock faible
    if (stockFaible && stockFaible.length > 0) {
        const stockEl = document.getElementById('stock-alerts');
        if (stockEl) {
            stockEl.innerHTML = stockFaible.map(p => `
                <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:rgba(239,68,68,0.05);border-radius:8px;margin-bottom:6px;">
                    <span style="font-size:0.85rem;font-weight:600;color:var(--brun)">${p.nom}</span>
                    <span style="background:rgba(239,68,68,0.12);color:#ef4444;padding:3px 10px;border-radius:20px;font-size:0.75rem;font-weight:700">${p.stock} restant${p.stock > 1 ? 's' : ''}</span>
                </div>
            `).join('');
        }
    }

    // Info Boutique (Sidebar + Navbar)
    const userProfil = await api.get('/auth/profil');
    if (userProfil && userProfil.ok) {
        currentVendor = userProfil.data.utilisateur;
        currentVendor.valide = valide;
        
        // Sidebar
        const svsEl = document.getElementById('vendor-store-name');
        const vownEl = document.getElementById('vendor-owner-name');
        if (svsEl) svsEl.textContent = currentVendor.nom_boutique || 'Ma boutique';
        if (vownEl) vownEl.textContent = currentVendor.nom || '';
        
        // Sidebar Logo
        const logoImg = document.getElementById('sidebar-vendor-logo');
        const logoIcon = document.getElementById('sidebar-vendor-icon');
        if (logoImg && logoIcon) {
            if (currentVendor.logo) {
                logoImg.src = api.getImageUrl(currentVendor.logo);
                logoImg.style.display = 'block';
                logoIcon.style.display = 'none';
            } else {
                logoImg.style.display = 'none';
                logoIcon.style.display = 'block';
            }
        }
        
        // Navbar Badge
        const navName = document.getElementById('nav-user-name');
        const navInit = document.getElementById('nav-user-initials');
        if (navName) navName.textContent = currentVendor.nom || '';
        if (navInit) {
            const initials = (currentVendor.nom || 'V').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
            navInit.textContent = initials;
        }

        // Message de bienvenue
        const welEl = document.getElementById('welcome-message');
        if (welEl) welEl.innerHTML = `Ravi de vous revoir, <span style="color:var(--orange)">${(currentVendor.nom || '').split(' ')[0]}</span> ! 👋`;
        
        // Date du jour
        const dateEl = document.getElementById('current-date-display');
        if (dateEl) {
            const dateStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            dateEl.innerHTML = `<i class="fas fa-calendar-alt" style="margin-right:8px; color:var(--orange);"></i> ${dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}`;
        }
        
        // Pré-remplir les réglages boutique
        const setBout = document.getElementById('set-boutique');
        const setLoc  = document.getElementById('set-loc');
        const setDesc = document.getElementById('set-desc');
        const setLogo = document.getElementById('set-logo-url');
        const setBann = document.getElementById('set-banner-url');
        if (setBout) setBout.value = currentVendor.nom_boutique || '';
        if (setLoc)  setLoc.value  = currentVendor.localisation || '';
        if (setDesc) setDesc.value = currentVendor.description || '';
        if (setLogo) setLogo.value = currentVendor.logo || '';
        if (setBann) setBann.value = currentVendor.banniere || '';
        
        // Aperçu images boutique
        const logoPrev = document.getElementById('logo-preview-container');
        const bannPrev = document.getElementById('banner-preview-container');
        if (logoPrev && currentVendor.logo) {
            logoPrev.innerHTML = `<img src="${api.getImageUrl(currentVendor.logo)}" style="width:100%;height:100%;object-fit:cover;">`;
        }
        if (bannPrev && currentVendor.banniere) {
            bannPrev.innerHTML = `<img src="${api.getImageUrl(currentVendor.banniere)}" style="width:100%;height:100%;object-fit:cover;">`;
        }
    }

    // Listes
    renderRecentOrders(commandes);
    await chargerListeProduits();
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
    const container = document.getElementById('products-list-table');
    if (!container) return;

    // Afficher le skeleton de chargement
    container.innerHTML = `
        <div style="padding:20px;">
            ${Array(3).fill(`
                <div style="display:flex;gap:15px;align-items:center;margin-bottom:15px;">
                    <div class="skeleton" style="width:60px;height:60px;border-radius:12px;flex-shrink:0;"></div>
                    <div style="flex:1;">
                        <div class="skeleton" style="height:16px;width:60%;border-radius:8px;margin-bottom:8px;"></div>
                        <div class="skeleton" style="height:12px;width:30%;border-radius:6px;"></div>
                    </div>
                    <div class="skeleton" style="width:80px;height:30px;border-radius:20px;"></div>
                </div>
            `).join('')}
        </div>
    `;

    // Utiliser le vendeur_id depuis currentVendor (déjà chargé via chargerDonneesDashboard)
    let vendeurId = currentVendor ? (currentVendor.vendeur_id || currentVendor.id_vendeur) : null;

    // Si currentVendor pas encore disponible, appeler le profil une fois
    if (!vendeurId) {
        const profilRes = await api.get('/auth/profil');
        if (profilRes && profilRes.ok && profilRes.data.utilisateur) {
            vendeurId = profilRes.data.utilisateur.vendeur_id || profilRes.data.utilisateur.id_vendeur;
        }
    }

    // Requête avec vendeur_id correct depuis le profil
    const resProds = vendeurId
        ? await api.get(`/produits?vendeur_id=${vendeurId}&limite=100&tri=recent`)
        : await api.get('/produits?limite=100&tri=recent');

    if (!resProds || !resProds.ok) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon"><i class="fas fa-exclamation-triangle"></i></div>
                <h3>Erreur de chargement</h3>
                <p>Impossible de récupérer vos produits. Vérifiez votre connexion.</p>
                <button class="btn btn-primary" onclick="chargerListeProduits()">
                    <i class="fas fa-redo"></i> Réessayer
                </button>
            </div>
        `;
        return;
    }

    sellerProducts = resProds.data.produits || [];
    
    if (sellerProducts.length === 0) {
        container.innerHTML = `
            <div class="empty-state reveal reveal-up">
                <div class="empty-state-icon"><i class="fas fa-tshirt"></i></div>
                <h3>Aucun produit pour l'instant</h3>
                <p>Commencez à remplir votre boutique en ajoutant vos plus beaux pagnes !</p>
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
                    <th>Nom du produit</th>
                    <th>Prix</th>
                    <th>Stock</th>
                    <th>Catégorie</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${sellerProducts.map(p => {
                    const imgUrl = api.getImageUrl(p.images);
                    const stockBg = p.stock === 0 ? 'rgba(239,68,68,0.12)' : p.stock <= 5 ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)';
                    const stockColor = p.stock === 0 ? '#ef4444' : p.stock <= 5 ? '#d97706' : '#059669';
                    return `
                    <tr>
                        <td>
                            <div style="position:relative;width:60px;height:60px;">
                                <img loading="lazy" src="${imgUrl}"
                                     onerror="this.onerror=null;this.src='images/placeholder-pagne.jpg';"
                                     style="width:100%;height:100%;border-radius:12px;object-fit:cover;box-shadow:var(--shadow);">
                                ${p.stock <= 3 && p.stock > 0 ? '<span style="position:absolute;top:-4px;right:-4px;width:14px;height:14px;background:#f59e0b;border:2px solid white;border-radius:50%;"></span>' : ''}
                                ${p.stock === 0 ? '<span style="position:absolute;top:-4px;right:-4px;width:14px;height:14px;background:#ef4444;border:2px solid white;border-radius:50%;"></span>' : ''}
                            </div>
                        </td>
                        <td>
                            <div style="display:flex;flex-direction:column;">
                                <a href="produit.html?id=${p.id}" target="_blank"
                                   style="font-weight:700;color:var(--brun);text-decoration:none;"
                                   title="Voir sur le catalogue">${p.nom}</a>
                                <small style="font-size:0.7rem;color:var(--gris);text-transform:uppercase;margin-top:2px;">#P-${p.id}</small>
                            </div>
                        </td>
                        <td><span style="font-weight:700;color:var(--orange);">${api.formatPrice(p.prix)}</span></td>
                        <td>
                            <span style="background:${stockBg};color:${stockColor};padding:5px 12px;border-radius:20px;font-weight:700;font-size:0.78rem;white-space:nowrap;">
                                ${p.stock === 0 ? '⛔ Rupture' : p.stock + ' en stock'}
                            </span>
                        </td>
                        <td><span style="color:var(--brun);opacity:0.75;font-weight:500;font-size:0.88rem;">${p.categorie || '—'}</span></td>
                        <td>
                            <div class="action-btns">
                                <button class="btn" onclick="ouvrirModalProduit(${p.id})"
                                        style="background:var(--gris-l);color:var(--brun);padding:8px 12px;border-radius:10px;" title="Modifier">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn" onclick="supprimerProduit(${p.id})"
                                        style="background:rgba(239,68,68,0.1);color:#ef4444;padding:8px 12px;border-radius:10px;" title="Retirer de la vente">
                                    <i class="fas fa-trash-alt"></i>
                                </button>
                            </div>
                        </td>
                    </tr>`;
                }).join('')}
            </tbody>
        </table>
    `;
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
    if (currentVendor && currentVendor.valide !== 1) {
        toast('Votre compte vendeur est en attente de validation par l\'administration.', 'erreur');
        return;
    }
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

    // Validation côté client
    const nom = document.getElementById('prod-nom').value.trim();
    const prix = parseFloat(document.getElementById('prod-prix').value);
    const stock = parseInt(document.getElementById('prod-stock').value);
    const catId = parseInt(document.getElementById('prod-cat').value);

    if (!nom) { toast('Le nom du produit est requis.', 'erreur'); return; }
    if (!prix || prix <= 0) { toast('Le prix doit être supérieur à 0.', 'erreur'); return; }
    if (isNaN(catId)) { toast('Veuillez choisir une catégorie.', 'erreur'); return; }
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enregistrement...';

    let imageUrl = document.getElementById('prod-img')?.value || '';

    // Upload de l'image si un fichier est sélectionné
    if (fileInput && fileInput.files && fileInput.files[0]) {
        const formData = new FormData();
        formData.append('image', fileInput.files[0]);
        const uploadRes = await api.post('/upload', formData);
        if (uploadRes && uploadRes.ok) {
            imageUrl = uploadRes.data.url || uploadRes.data.path || '';
        } else {
            toast('Erreur lors de l\'upload de l\'image. Vérifiez le format (JPG, PNG).', 'erreur');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-save"></i> Enregistrer le produit';
            return;
        }
    }

    const data = {
        nom,
        prix,
        stock: isNaN(stock) ? 0 : stock,
        id_categorie: catId,
        description: document.getElementById('prod-desc')?.value || '',
        images: imageUrl ? [imageUrl] : []
    };

    const res = id
        ? await api.put(`/produits/${id}`, data)
        : await api.post('/produits', data);

    if (res && res.ok) {
        toast(id ? '✅ Produit mis à jour avec succès !' : '✅ Produit ajouté au catalogue !');
        fermerModalProduit();
        await chargerDonneesDashboard();
    } else {
        const msg = res?.data?.message || 'Une erreur est survenue lors de l\'enregistrement.';
        toast(msg, 'erreur');
    }

    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-save"></i> Enregistrer le produit';
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
    // Tableau résumé (Dashboard home)
    container.innerHTML = `
        <table class="order-table">
            <thead><tr><th>ID</th><th>Date</th><th>Acheteur</th><th>Montant</th><th>Statut</th></tr></thead>
            <tbody>
                ${commandes.map(c => `
                    <tr class="reveal-up">
                        <td style="font-weight:700;color:var(--brun);">#BW-${c.id}</td>
                        <td><span style="color:var(--gris);font-size:0.85rem;">${new Date(c.created_at).toLocaleDateString()}</span></td>
                        <td style="font-weight:600;">${c.acheteur}</td>
                        <td style="font-weight:700;color:var(--orange);">${api.formatPrice(c.montant_total)}</td>
                        <td><span class="status-badge status-${c.statut}" style="padding:5px 12px;border-radius:20px;font-size:0.72rem;font-weight:700;">${c.statut.replace('_',' ')}</span></td>
                    </tr>`).join('')}
            </tbody>
        </table>`;

    // Cartes modernes (onglet Commandes)
    const fullContainer = document.getElementById('full-orders-list');
    if (!fullContainer) return;

    const CFG = {
        en_attente:   { label:'En attente',   color:'#f59e0b', bg:'#fef3c7', icon:'fa-clock' },
        payee:        { label:'Payée',         color:'#3b82f6', bg:'#dbeafe', icon:'fa-check-circle' },
        en_livraison: { label:'En livraison',  color:'#8b5cf6', bg:'#ede9fe', icon:'fa-motorcycle' },
        livree:       { label:'Livrée ✓',      color:'#10b981', bg:'#d1fae5', icon:'fa-box' },
        annulee:      { label:'Annulée',        color:'#ef4444', bg:'#fee2e2', icon:'fa-times-circle' },
    };
    const NEXT = {
        en_attente:   { val:'payee',        label:'✓ Valider paiement',  color:'#3b82f6' },
        payee:        { val:'en_livraison', label:'🏍️ Lancer livraison', color:'#8b5cf6' },
        en_livraison: { val:'livree',       label:'📦 Marquer livré',    color:'#10b981' },
    };
    const STEPS = ['en_attente','payee','en_livraison','livree'];

    fullContainer.innerHTML = commandes.map(c => {
        const cfg  = CFG[c.statut] || { label:c.statut, color:'#666', bg:'#eee', icon:'fa-circle' };
        const next = NEXT[c.statut];
        const si   = STEPS.indexOf(c.statut);

        const steps = STEPS.map((s,i) => {
            const sc   = CFG[s];
            const done = i <= si && c.statut !== 'annulee';
            const cur  = i === si && c.statut !== 'annulee';
            return `
              <div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex:1;">
                <div style="width:26px;height:26px;border-radius:50%;background:${done?sc.color:'#e5e7eb'};display:flex;align-items:center;justify-content:center;box-shadow:${cur?'0 0 0 3px '+sc.color+'44':'none'};">
                  <i class="fas ${sc.icon}" style="font-size:0.55rem;color:${done?'#fff':'#bbb'};"></i>
                </div>
                <span style="font-size:0.58rem;color:${done?sc.color:'#bbb'};font-weight:${cur?700:400};text-align:center;">${sc.label}</span>
              </div>
              ${i<STEPS.length-1?`<div style="flex:1;height:2px;background:${i<si&&c.statut!=='annulee'?'#10b981':'#e5e7eb'};margin-top:13px;border-radius:2px;"></div>`:''}`;
        }).join('');

        return `
        <div style="background:white;border-radius:16px;padding:20px 22px;margin-bottom:14px;box-shadow:0 2px 12px rgba(0,0,0,0.07);border:1px solid #f0f0f0;transition:box-shadow 0.2s;"
             onmouseenter="this.style.boxShadow='0 6px 24px rgba(0,0,0,0.11)'" onmouseleave="this.style.boxShadow='0 2px 12px rgba(0,0,0,0.07)'">

          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="width:40px;height:40px;border-radius:11px;background:linear-gradient(135deg,var(--brun),var(--orange));display:flex;align-items:center;justify-content:center;">
                <i class="fas fa-shopping-bag" style="color:white;font-size:0.9rem;"></i>
              </div>
              <div>
                <div style="font-weight:800;color:var(--brun);">#BW-${c.id}</div>
                <div style="font-size:0.72rem;color:var(--gris);">${new Date(c.created_at).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'})}</div>
              </div>
            </div>
            <span style="background:${cfg.bg};color:${cfg.color};padding:5px 13px;border-radius:20px;font-size:0.72rem;font-weight:700;display:flex;align-items:center;gap:5px;">
              <i class="fas ${cfg.icon}"></i> ${cfg.label}
            </span>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;">
            <div style="background:#f8f9fa;border-radius:9px;padding:9px 13px;">
              <div style="font-size:0.67rem;color:var(--gris);text-transform:uppercase;margin-bottom:3px;">Acheteur</div>
              <div style="font-weight:600;color:var(--brun);font-size:0.88rem;">${c.acheteur}</div>
            </div>
            <div style="background:#f8f9fa;border-radius:9px;padding:9px 13px;">
              <div style="font-size:0.67rem;color:var(--gris);text-transform:uppercase;margin-bottom:3px;">Montant</div>
              <div style="font-weight:800;color:var(--orange);">${api.formatPrice(c.montant_total)}</div>
            </div>
            <div style="background:#f8f9fa;border-radius:9px;padding:9px 13px;grid-column:1/-1;">
              <div style="font-size:0.67rem;color:var(--gris);text-transform:uppercase;margin-bottom:3px;">Adresse</div>
              <div style="font-size:0.83rem;color:var(--brun);">
                <i class="fas fa-map-marker-alt" style="color:var(--orange);margin-right:5px;"></i>
                ${c.zone_nom||''} — ${c.adresse_liv||'Non renseignée'}
                <span style="color:var(--orange);font-weight:700;margin-left:6px;">+${api.formatPrice(c.frais_livraison)}</span>
              </div>
            </div>
          </div>

          ${c.statut!=='annulee'?`
          <div style="display:flex;align-items:flex-start;margin-bottom:14px;padding:12px;background:#f8faff;border-radius:11px;">${steps}</div>`:''}

          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${next?`<button onclick="faireAvancerCommande(${c.id},'${next.val}',this)"
              style="flex:1;padding:10px 14px;background:${next.color};color:white;border:none;border-radius:9px;font-weight:700;font-size:0.82rem;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;"
              onmouseenter="this.style.opacity='0.82'" onmouseleave="this.style.opacity='1'">${next.label}</button>`:''}
            ${c.statut==='en_livraison'?`<button onclick="lancerSimulationLivraison(${c.id})"
              style="padding:10px 14px;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:white;border:none;border-radius:9px;font-weight:700;font-size:0.82rem;cursor:pointer;display:flex;align-items:center;gap:7px;"
              onmouseenter="this.style.opacity='0.82'" onmouseleave="this.style.opacity='1'">
              <i class="fas fa-satellite-dish"></i> Simulation client</button>`:''}
            ${c.statut==='en_attente'?`<button onclick="updateOrderStatus(${c.id},'annulee')"
              style="padding:10px 13px;background:#fee2e2;color:#ef4444;border:none;border-radius:9px;font-weight:600;font-size:0.8rem;cursor:pointer;"
              title="Annuler"><i class="fas fa-times"></i></button>`:''}
          </div>
        </div>`;
    }).join('');
}

async function faireAvancerCommande(id, newStatus, btn) {
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; }
    const res = await api.put(`/commandes/${id}/statut`, { statut: newStatus });
    if (res.ok) {
        toast(`✅ Commande #BW-${id} → ${newStatus.replace('_',' ')}`, 'succes');
        await chargerDonneesDashboard();
        if (newStatus === 'en_livraison') setTimeout(() => lancerSimulationLivraison(id), 600);
    } else {
        toast(res.data?.message || 'Erreur', 'erreur');
        if (btn) { btn.disabled = false; btn.innerHTML = 'Réessayer'; }
    }
}

async function updateOrderStatus(id, newStatus) {
    const res = await api.put(`/commandes/${id}/statut`, { statut: newStatus });
    if (res.ok) { toast('Statut mis à jour !'); chargerDonneesDashboard(); }
    else toast('Erreur lors de la mise à jour', 'erreur');
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


// ============================================================
// DÉCONNEXION
// ============================================================

/** Fermer la modale de déconnexion */
function fermerLogoutModal() {
    const overlay = document.getElementById('logout-confirm-overlay');
    if (overlay) overlay.remove();
}

/** Déconnecter immédiatement */
function executerDeconnexion() {
    fermerLogoutModal();
    toast('À bientôt ! Déconnexion en cours...', 'succes');
    setTimeout(() => session.deconnecter(), 900);
}

/**
 * Affiche une confirmation stylisée avant de déconnecter le vendeur.
 */
function confirmerDeconnexion() {
    // Éviter les doublons
    if (document.getElementById('logout-confirm-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'logout-confirm-overlay';
    overlay.setAttribute('onclick', "if(event.target===this) fermerLogoutModal()");
    overlay.style.cssText = `
        position: fixed; inset: 0;
        background: rgba(10,10,20,0.6);
        backdrop-filter: blur(6px);
        z-index: 9999;
        display: flex; align-items: center; justify-content: center;
        animation: fadeIn 0.2s ease;
    `;

    overlay.innerHTML = `
        <div style="
            background: white;
            border-radius: 24px;
            padding: 40px 36px;
            max-width: 380px;
            width: 90%;
            text-align: center;
            box-shadow: 0 30px 80px rgba(0,0,0,0.25);
            animation: slideUp 0.25s cubic-bezier(0.2,0.8,0.2,1);
        ">
            <div style="
                width: 72px; height: 72px;
                background: linear-gradient(135deg, #fee2e2, #fecaca);
                border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                margin: 0 auto 20px;
                box-shadow: 0 8px 20px rgba(239,68,68,0.2);
            ">
                <i class="fas fa-sign-out-alt" style="font-size: 1.8rem; color: #ef4444;"></i>
            </div>
            <h3 style="font-size: 1.3rem; color: #1a1a2e; margin-bottom: 10px; font-weight: 800;">
                Se déconnecter ?
            </h3>
            <p style="color: #888; font-size: 0.92rem; margin-bottom: 30px; line-height: 1.5;">
                Vous allez quitter votre tableau de bord vendeur.<br>
                Vous pourrez vous reconnecter à tout moment.
            </p>
            <div style="display: flex; gap: 12px;">
                <button
                    onclick="fermerLogoutModal()"
                    style="flex: 1; padding: 13px; border: 2px solid #e5e7eb; border-radius: 14px;
                           background: white; color: #555; font-weight: 700; font-size: 0.95rem;
                           cursor: pointer;">
                    Annuler
                </button>
                <button
                    onclick="executerDeconnexion()"
                    style="flex: 1; padding: 13px; border: none; border-radius: 14px;
                           background: linear-gradient(135deg, #ef4444, #dc2626);
                           color: white; font-weight: 700; font-size: 0.95rem;
                           cursor: pointer; box-shadow: 0 6px 20px rgba(239,68,68,0.35);">
                    <i class="fas fa-sign-out-alt" style="margin-right:6px;"></i> Déconnecter
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
}

window.lancerSimulationLivraison = lancerSimulationLivraison;
window.faireAvancerCommande = faireAvancerCommande;
window.switchSection = switchSection;
window.ouvrirModalProduit = ouvrirModalProduit;
window.fermerModalProduit = fermerModalProduit;
window.handleSubmitProduit = handleSubmitProduit;
window.supprimerProduit = supprimerProduit;
window.updateOrderStatus = updateOrderStatus;
window.handleUpdateProfile = handleUpdateProfile;
window.previewImage = previewImage;
window.previewSettingImage = previewSettingImage;
window.confirmerDeconnexion = confirmerDeconnexion;
window.fermerLogoutModal = fermerLogoutModal;
window.executerDeconnexion = executerDeconnexion;



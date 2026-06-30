// ============================================================
// BEAUTIFUL WOMEN - Logique Dashboard Administrateur (admin-dashboard.js)
// ============================================================

let cacheVendeurs = [];
let cacheProduits = [];

document.addEventListener('DOMContentLoaded', () => {
    // Auth Guard : Admin uniquement
    if (!session.estConnecte() || session.getUser().role !== 'admin') {
        toast('Accès réservé aux administrateurs', 'erreur');
        setTimeout(() => window.location.href = 'index.html', 1500);
        return;
    }

    // Afficher le nom de l'admin
    const user = session.getUser();
    document.getElementById('admin-name').textContent = user.nom;

    // Charger les statistiques globales par défaut
    chargerStats();
});

/** Basculer d'onglet dans le menu de navigation */
function switchTab(tabId, btn) {
    // Changer l'onglet actif dans la sidebar
    document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Changer la section active du contenu
    document.querySelectorAll('.dashboard-section').forEach(s => s.classList.remove('active'));
    const section = document.getElementById(`section-${tabId}`);
    if (section) section.classList.add('active');

    // Charger les données dynamiquement selon l'onglet
    if (tabId === 'stats') {
        chargerStats();
    } else if (tabId === 'vendeurs') {
        chargerVendeurs();
    } else if (tabId === 'produits') {
        chargerProduits();
    } else if (tabId === 'litiges') {
        chargerLitiges();
    }
}

// ============================================================
// ONGLET 1 : STATS GLOBALES & COMMANDES RÉCENTES
// ============================================================
async function chargerStats() {
    const res = await api.get('/admin/stats');
    if (res.ok) {
        const { stats, commandesRecentes } = res.data;

        // Remplir les indicateurs clés (KPIs)
        document.getElementById('kpi-ca').textContent = api.formatPrice(stats.chiffre_affaires);
        document.getElementById('kpi-acheteurs').textContent = stats.acheteurs;
        document.getElementById('kpi-vendeurs').textContent = stats.vendeurs;
        document.getElementById('kpi-produits').textContent = stats.produits;

        // Remplir le tableau des commandes récentes
        const tbody = document.getElementById('table-commandes-recentes').querySelector('tbody');
        if (commandesRecentes.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;">Aucune commande récente.</td></tr>`;
            return;
        }

        tbody.innerHTML = commandesRecentes.map(c => `
            <tr>
                <td><strong>#BW-${c.id}</strong></td>
                <td>${c.acheteur_nom}</td>
                <td>${new Date(c.created_at).toLocaleDateString()}</td>
                <td style="font-weight:700; color:var(--orange);">${api.formatPrice(c.montant_total)}</td>
                <td><span class="badge status-badge status-${c.statut}">${c.statut.replace('_', ' ')}</span></td>
            </tr>
        `).join('');
    } else {
        toast('Erreur lors du chargement des statistiques.', 'erreur');
    }
}

// ============================================================
// ONGLET 2 : VALIDATION DES VENDEURS
// ============================================================
async function chargerVendeurs() {
    const res = await api.get('/admin/vendeurs');
    if (res.ok) {
        cacheVendeurs = res.data.vendeurs;
        renderVendeurs(cacheVendeurs);
    } else {
        toast('Erreur lors du chargement des vendeurs.', 'erreur');
    }
}

function renderVendeurs(list) {
    const tbody = document.getElementById('table-vendeurs').querySelector('tbody');
    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Aucun vendeur enregistré.</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(v => {
        const hasLogo = v.logo && v.logo !== 'null' && v.logo !== 'undefined';
        const logoHtml = hasLogo 
            ? `<img src="${api.getImageUrl(v.logo)}" alt="Logo" style="width:35px; height:35px; border-radius:50%; object-fit:cover;">`
            : `<div style="width:35px; height:35px; border-radius:50%; background:var(--creme-d); display:flex; align-items:center; justify-content:center; color:var(--orange); font-size:1rem; border:1px solid rgba(232,119,34,0.15);"><i class="fas fa-store"></i></div>`;

        return `
        <tr>
            <td>
                <div style="display:flex; align-items:center; gap:10px;">
                    ${logoHtml}
                    <strong>${v.nom_boutique}</strong>
                </div>
            </td>
            <td>
                <div>${v.nom_proprietaire}</div>
                <div style="font-size:0.75rem; color:var(--gris);">${v.email}</div>
            </td>
            <td>${v.localisation || 'Abidjan'}</td>
            <td>${new Date(v.created_at).toLocaleDateString()}</td>
            <td>
                <span class="badge ${v.valide ? 'active' : 'pending'}">
                    ${v.valide ? '✓ Validé' : '⌛ En attente'}
                </span>
            </td>
            <td>
                <div class="action-btns">
                    ${v.valide 
                        ? `<button class="btn-action danger" onclick="toggleValiderVendeur(${v.id}, 0)"><i class="fas fa-ban"></i> Suspendre</button>`
                        : `<button class="btn-action success" onclick="toggleValiderVendeur(${v.id}, 1)"><i class="fas fa-check"></i> Valider</button>`
                    }
                </div>
            </td>
        </tr>
        `;
    }).join('');
}

async function toggleValiderVendeur(id, newStatus) {
    const confirmMsg = newStatus === 1 
        ? 'Voulez-vous valider ce vendeur ? Il pourra vendre sur la plateforme.' 
        : 'Voulez-vous suspendre ce vendeur ? Sa boutique et ses articles ne seront plus visibles.';
        
    if (!confirm(confirmMsg)) return;

    const res = await api.put(`/admin/vendeurs/${id}/valider`, { valide: newStatus });
    if (res.ok) {
        toast(res.data.message, 'succes');
        chargerVendeurs();
    } else {
        toast('Action échouée.', 'erreur');
    }
}

function filtrerVendeurs() {
    const query = document.getElementById('search-vendeurs').value.toLowerCase().trim();
    const filtered = cacheVendeurs.filter(v => 
        v.nom_boutique.toLowerCase().includes(query) || 
        v.nom_proprietaire.toLowerCase().includes(query) || 
        (v.localisation || '').toLowerCase().includes(query)
    );
    renderVendeurs(filtered);
}

// ============================================================
// ONGLET 3 : MODÉRATION DES PRODUITS
// ============================================================
async function chargerProduits() {
    const res = await api.get('/admin/produits');
    if (res.ok) {
        cacheProduits = res.data.produits;
        renderProduits(cacheProduits);
    } else {
        toast('Erreur lors du chargement des produits.', 'erreur');
    }
}

function renderProduits(list) {
    const tbody = document.getElementById('table-produits').querySelector('tbody');
    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">Aucun produit trouvé.</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(p => `
        <tr>
            <td>
                <img src="${api.getImageUrl(p.images)}" alt="${p.nom}" style="width:40px; height:40px; border-radius:6px; object-fit:cover;">
            </td>
            <td><strong>${p.nom}</strong></td>
            <td>${p.nom_boutique}</td>
            <td>${p.categorie}</td>
            <td style="font-weight:700; color:var(--orange);">${api.formatPrice(p.prix)}</td>
            <td>${p.stock} pcs</td>
            <td>
                <span class="badge ${p.actif ? 'active' : 'inactive'}">
                    ${p.actif ? 'Actif' : 'Masqué'}
                </span>
            </td>
            <td>
                <div class="action-btns">
                    ${p.actif
                        ? `<button class="btn-action danger" onclick="toggleModererProduit(${p.id}, 0)"><i class="fas fa-eye-slash"></i> Masquer</button>`
                        : `<button class="btn-action success" onclick="toggleModererProduit(${p.id}, 1)"><i class="fas fa-eye"></i> Afficher</button>`
                    }
                </div>
            </td>
        </tr>
    `).join('');
}

async function toggleModererProduit(id, newStatus) {
    const res = await api.put(`/admin/produits/${id}/moderer`, { actif: newStatus });
    if (res.ok) {
        toast(res.data.message, 'succes');
        chargerProduits();
    } else {
        toast('Erreur lors de la modération du produit.', 'erreur');
    }
}

function filtrerProduits() {
    const query = document.getElementById('search-produits').value.toLowerCase().trim();
    const filtered = cacheProduits.filter(p => 
        p.nom.toLowerCase().includes(query) || 
        p.nom_boutique.toLowerCase().includes(query) || 
        p.categorie.toLowerCase().includes(query)
    );
    renderProduits(filtered);
}

// ============================================================
// ONGLET 4 : GESTION DES LITIGES
// ============================================================
async function chargerLitiges() {
    const res = await api.get('/admin/litiges');
    if (res.ok) {
        renderLitiges(res.data.litiges);
    } else {
        toast('Erreur lors du chargement des litiges.', 'erreur');
    }
}

function renderLitiges(list) {
    const tbody = document.getElementById('table-litiges').querySelector('tbody');
    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;">Aucun litige signalé.</td></tr>`;
        return;
    }

    tbody.innerHTML = list.map(l => `
        <tr>
            <td><strong>#BW-${l.id_commande}</strong></td>
            <td>
                <div>${l.acheteur_nom}</div>
                <div style="font-size:0.75rem; color:var(--gris);">Commande: ${api.formatPrice(l.montant_total)}</div>
            </td>
            <td><div style="max-width:300px; word-wrap:break-word; font-style:italic;">"${l.description}"</div></td>
            <td>${new Date(l.created_at).toLocaleDateString()}</td>
            <td>
                <span class="badge ${l.statut === 'resolu' ? 'active' : 'pending'}">
                    ${l.statut === 'resolu' ? 'Résolu' : 'En attente'}
                </span>
            </td>
            <td>
                <div class="action-btns">
                    ${l.statut === 'en_attente'
                        ? `<button class="btn-action success" onclick="resoudreLitige(${l.id})"><i class="fas fa-check-double"></i> Résoudre</button>`
                        : `<span style="font-size:0.8rem; color:var(--gris); font-weight:700;">Aucune action</span>`
                    }
                </div>
            </td>
        </tr>
    `).join('');
}

async function resoudreLitige(id) {
    if (!confirm('Voulez-vous marquer ce litige comme résolu ?')) return;

    const res = await api.put(`/admin/litiges/${id}/resoudre`);
    if (res.ok) {
        toast(res.data.message, 'succes');
        chargerLitiges();
    } else {
        toast('Action échouée.', 'erreur');
    }
}

// Exposer globalement les fonctions appelées par le HTML
window.switchTab = switchTab;
window.toggleValiderVendeur = toggleValiderVendeur;
window.filtrerVendeurs = filtrerVendeurs;
window.toggleModererProduit = toggleModererProduit;
window.filtrerProduits = filtrerProduits;
window.resoudreLitige = resoudreLitige;

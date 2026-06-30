// ============================================================
// BEAUTIFUL WOMEN - Logique Profil (profil.js)
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('demo_success') === '1') {
        toast('🎉 Paiement simulé avec succès ! Voici vos commandes.', 'succes');
    }

    if (!session.estConnecte()) {
        toast('Veuillez vous connecter pour accéder à votre profil', 'erreur');
        setTimeout(() => window.location.href = 'auth.html', 2000);
        return;
    }

    await Promise.all([chargerInfosUser(), chargerCommandes(), chargerFavoris()]);

    // ── Listener temps réel : le vendeur a lancé une simulation ──
    // Quand lancerSimulationLivraison() écrit dans localStorage depuis l'onglet vendeur,
    // cet événement se déclenche dans l'onglet client et met à jour le suivi.
    window.addEventListener('storage', (e) => {
        if (e.key && e.key.startsWith('tracking_bw_')) {
            const orderId = e.key.replace('tracking_bw_', '');
            const data = JSON.parse(e.newValue || '{}');
            if (data.currentStep) {
                // Mettre à jour le bandeau de statut si le modal de suivi est ouvert
                const overlay = document.getElementById('simul-status-overlay');
                const statusEl = document.getElementById('simul-status-text');
                const progressFill = document.getElementById('track-progress-fill');
                if (overlay && statusEl) {
                    overlay.style.display = 'block';
                    statusEl.innerHTML = `<strong>${data.currentStep.status}</strong> — ${data.currentStep.desc}`;
                    if (progressFill) progressFill.style.width = data.currentStep.progress + '%';
                }
                // Toast de notification pour le client
                toast(`📦 ${data.currentStep.status} : ${data.currentStep.desc}`, 'succes');
            }
        }
    });
});


/** Changer de section (Tabs) */
function switchSection(id, btn) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');

    document.querySelectorAll('.profile-nav-item').forEach(i => i.classList.remove('active'));
    btn.classList.add('active');
}

/** Charger Infos Utilisateur */
async function chargerInfosUser() {
    const res = await api.get('/auth/profil');
    if (res.ok) {
        const u = res.data.utilisateur;
        document.getElementById('profile-name').textContent = u.nom;
        document.getElementById('profile-role').textContent = u.role;
        
        // Form
        document.getElementById('acc-nom').value = u.nom;
        document.getElementById('acc-email').value = u.email;
        document.getElementById('acc-tel').value = u.telephone || 'Non renseigné';

        if (u.photo) {
            document.getElementById('profile-avatar').innerHTML = `<img src="${api.getImageUrl(u.photo)}" alt="Avatar">`;
        }
    }
}

/** Charger Historique Commandes */
async function chargerCommandes() {
    const res = await api.get('/commandes/mes-commandes');
    const container = document.getElementById('orders-list');

    if (!res.ok || res.data.commandes.length === 0) {
        container.innerHTML = `
            <div style="text-align:center; padding:40px; color:var(--gris);">
                <i class="fas fa-box-open" style="font-size:3rem; margin-bottom:15px; opacity:0.3;"></i>
                <p>Vous n'avez pas encore passé de commande.</p>
                <a href="catalogue.html" class="btn btn-primary" style="margin-top:20px;">Faire mon premier achat</a>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <table class="order-table">
            <thead>
                <tr>
                    <th>Commande</th>
                    <th>Date</th>
                    <th>Montant</th>
                    <th>Articles</th>
                    <th>Statut</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${res.data.commandes.map(c => `
                    <tr>
                        <td><strong>#BW-${c.id}</strong></td>
                        <td>${new Date(c.created_at).toLocaleDateString()}</td>
                        <td style="font-weight:700; color:var(--orange);">${api.formatPrice(c.montant_total)}</td>
                        <td>${c.nb_articles} article(s)</td>
                        <td><span class="status-badge status-${c.statut}">${c.statut.replace('_', ' ')}</span></td>
                        <td>
                            <div style="display:flex; gap:5px;">
                                <button class="btn btn-vert" style="padding:5px 10px; font-size:0.75rem;" onclick="detailCommande(${c.id})">
                                    <i class="fas fa-eye"></i> Détails
                                </button>
                                <button class="btn btn-primary" style="padding:5px 10px; font-size:0.75rem;" onclick="ouvrirSuivi(${c.id})">
                                    <i class="fas fa-truck-moving"></i> Suivre
                                </button>
                                ${['en_attente', 'payee'].includes(c.statut) ? `
                                    <button class="btn btn-outline" style="padding:5px 10px; font-size:0.75rem; color:var(--rouge); border-color:var(--rouge);" onclick="annulerCommande(${c.id})">
                                        <i class="fas fa-times"></i> Annuler
                                    </button>
                                ` : ''}
                                ${c.statut !== 'annulee' ? `
                                    <button class="btn btn-outline" style="padding:5px 10px; font-size:0.75rem; color:var(--orange); border-color:var(--orange);" onclick="ouvrirSignalementLitige(${c.id})">
                                        <i class="fas fa-exclamation-triangle"></i> Signaler
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

/** Annuler une commande */
async function annulerCommande(id) {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette commande ? Cette action est irréversible.')) return;

    try {
        const res = await api.put(`/commandes/${id}/statut`, { statut: 'annulee' });
        if (res.ok) {
            toast('Commande annulée avec succès.', 'succes');
            chargerCommandes(); // Recharger la liste
        } else {
            toast(res.data.message || 'Erreur lors de l\'annulation', 'erreur');
        }
    } catch (err) {
        toast('Erreur de connexion', 'erreur');
    }
}

// ============================================================
// LOGIQUE CARTE ET SUIVI DANS LE PROFIL
// ============================================================

let trackMap = null;
let trackClientMarker = null;
let trackDeliveryMarker = null;
let trackShopMarker = null;
const NANAWAX_COORDS = [5.3678, -3.9856];

/** Ouvrir le modal de suivi avec détails et carte */
async function ouvrirSuivi(orderId) {
    const modal = document.getElementById('tracking-modal');
    modal.style.display = 'flex';
    
    // Reset
    document.getElementById('track-order-id').textContent = `#BW-${orderId}`;
    document.getElementById('track-items-list').innerHTML = '<p class="skeleton" style="height:20px;"></p>';
    document.getElementById('simul-status-overlay').style.display = 'none';

    try {
        const res = await api.get(`/commandes/${orderId}`);
        if (res.ok) {
            const { commande, lignes } = res.data;
            
            // 1. Render les articles
            renderOrderItemsMini(lignes);
            document.getElementById('track-address').textContent = commande.adresse_liv || 'Non renseignée';
            document.getElementById('track-status-name').textContent = commande.statut.replace('_', ' ');
            document.getElementById('track-total-price').textContent = api.formatPrice(commande.montant_total);

            // Progress bar mapping
            const progressMap = { 'en_attente': 10, 'payee': 30, 'en_livraison': 60, 'livree': 100 };
            document.getElementById('track-progress-fill').style.width = (progressMap[commande.statut] || 10) + '%';

            // 2. Initialiser la carte et lancer la simulation
            setTimeout(() => initTrackingMap(commande.adresse_liv), 300);
        }
    } catch (err) {
        toast('Impossible de charger les détails.', 'erreur');
    }
}

function renderOrderItemsMini(lignes) {
    const container = document.getElementById('track-items-list');
    container.innerHTML = lignes.map(l => `
        <div class="item-mini">
            <img src="${api.getImageUrl(l.images)}" alt="${l.nom}">
            <div style="flex:1">
                <div style="font-weight:600">${l.nom}</div>
                <div style="font-size:0.75rem; color:var(--gris)">Qté: ${l.quantite} × ${api.formatPrice(l.prix_unitaire)}</div>
            </div>
            <div style="font-weight:700">${api.formatPrice(l.quantite * l.prix_unitaire)}</div>
        </div>
    `).join('');
}

function detailCommande(id) {
    ouvrirSuivi(id); // On unifie les vues pour plus de simplicité et d'impact visuel
}

function fermerTracking() {
    document.getElementById('tracking-modal').style.display = 'none';
}

function initTrackingMap(adresse) {
    if (!trackMap) {
        trackMap = L.map('tracking-map').setView(NANAWAX_COORDS, 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(trackMap);

        const shopIcon = L.divIcon({
            html: '<i class="fas fa-store" style="color:var(--orange); font-size:20px;"></i>',
            className: 'custom-div-icon', iconSize: [30, 30], iconAnchor: [15, 15]
        });
        trackShopMarker = L.marker(NANAWAX_COORDS, { icon: shopIcon }).addTo(trackMap).bindPopup('Maison Nanawax');
    } else {
        trackMap.invalidateSize();
    }

    localiserEtSimulerDansProfil(adresse);
}

async function localiserEtSimulerDansProfil(query) {
    const overlay = document.getElementById('simul-status-overlay');
    const statusText = document.getElementById('simul-status-text');
    overlay.style.display = 'block';
    statusText.textContent = 'Localisation de votre adresse...';

    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Abidjan')}`);
        const data = await res.json();

        let clientCoords = [5.3364, -4.0267]; // Fallback Plateau
        if (data && data.length > 0) {
            clientCoords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        }

        if (trackClientMarker) trackMap.removeLayer(trackClientMarker);
        const userIcon = L.divIcon({
            html: '<i class="fas fa-map-marker-alt" style="color:var(--brun); font-size:24px;"></i>',
            className: 'custom-div-icon', iconSize: [30, 30], iconAnchor: [15, 30]
        });
        trackClientMarker = L.marker(clientCoords, { icon: userIcon }).addTo(trackMap).bindPopup('<b>Livraison ici</b>');
        
        trackMap.fitBounds(L.latLngBounds([NANAWAX_COORDS, clientCoords]), { padding: [40, 40] });

        // Démarrer Simulation
        animateMotorcycle(clientCoords);

    } catch (e) {
        console.warn('Erreur localisation profil', e);
    }
}

function animateMotorcycle(endCoords) {
    const start = NANAWAX_COORDS;
    const statusText = document.getElementById('simul-status-text');

    if (trackDeliveryMarker) trackMap.removeLayer(trackDeliveryMarker);
    const deliveryIcon = L.divIcon({
        html: '<i class="fas fa-motorcycle" style="color:var(--vert); font-size:20px; background:white; padding:5px; border-radius:50%; box-shadow:0 2px 10px rgba(0,0,0,0.2);"></i>',
        className: 'custom-div-icon', iconSize: [30, 30], iconAnchor: [15, 15]
    });
    trackDeliveryMarker = L.marker(start, { icon: deliveryIcon }).addTo(trackMap);

    let progress = 0;
    const frames = 100;
    const interval = setInterval(() => {
        progress++;
        const pct = progress / frames;
        const currentLat = start[0] + (endCoords[0] - start[0]) * pct;
        const currentLng = start[1] + (endCoords[1] - start[1]) * pct;
        trackDeliveryMarker.setLatLng([currentLat, currentLng]);

        if (progress < 20) statusText.textContent = '📦 Préparation...';
        else if (progress < 80) statusText.textContent = '🏍️ Livraison en cours...';
        else statusText.textContent = '🏁 La moto approche !';

        if (progress === frames) {
            clearInterval(interval);
            statusText.innerHTML = '<span style="color:var(--vert)">✨ Livré à destination !</span>';
        }
    }, 40);
}

// --- Favoris ---
async function chargerFavoris() {
    const grid = document.getElementById('favorites-grid');
    const ids = JSON.parse(localStorage.getItem('bw_favoris') || '[]');

    if (ids.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align:center; padding:40px; color:var(--gris);">
                <p>Vous n'avez pas encore de coups de cœur.</p>
                <a href="catalogue.html" class="btn btn-vert" style="margin-top:20px;">Explorer le catalogue</a>
            </div>
        `;
        return;
    }

    const res = await api.get(`/produits?ids=${ids.join(',')}`);
    if (res.ok && res.data.produits.length > 0) {
        grid.innerHTML = res.data.produits.map(p => `
            <div class="produit-card">
                <div class="produit-card-img">
                    <img loading="lazy" src="${api.getImageUrl(p.images)}" alt="${p.nom}">
                    <button class="produit-card-fav active" onclick="retirerFavoriAction(this, ${p.id})">
                        <i class="fas fa-heart" style="color:var(--orange)"></i>
                    </button>
                </div>
                <div class="produit-card-body">
                    <div class="produit-card-nom"><a href="produit.html?id=${p.id}">${p.nom}</a></div>
                    <div class="stars">${etoilesHTML(p.note_moyenne || 0)}</div>
                    <div class="produit-card-prix" style="margin-top:10px">${api.formatPrice(p.prix)}</div>
                </div>
            </div>
        `).join('');
    }
}

function retirerFavoriAction(btn, id) {
    toggleFavori(btn, id);
    btn.closest('.produit-card').remove();
    const ids = JSON.parse(localStorage.getItem('bw_favoris') || '[]');
    if (ids.length === 0) chargerFavoris();
}

/** Mise à jour profil */
async function handleUpdateProfile(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-save-profile');
    const data = {
        nom: document.getElementById('acc-nom').value,
        telephone: document.getElementById('acc-tel').value
    };
    btn.disabled = true;
    const res = await api.put('/auth/profil', data);
    if (res.ok) {
        toast('Profil mis à jour ! ✨');
        document.getElementById('profile-name').textContent = data.nom;
        const user = session.getUser();
        user.nom = data.nom;
        localStorage.setItem('bw_user', JSON.stringify(user));
    }
    btn.disabled = false;
}

async function uploadAvatar(input) {
    if (!input.files || !input.files[0]) return;
    const formData = new FormData();
    formData.append('image', input.files[0]);
    const res = await api.post('/upload', formData);
    if (res.ok) {
        const photoUrl = res.data.url;
        await api.put('/auth/profil', { photo: photoUrl });
        document.getElementById('profile-avatar').innerHTML = `<img src="${photoUrl}" alt="Avatar">`;
        const user = session.getUser();
        user.photo = photoUrl;
        localStorage.setItem('bw_user', JSON.stringify(user));
    }
}

// Exposer globalement
window.switchSection = switchSection;
window.retirerFavoriAction = retirerFavoriAction;
window.detailCommande = detailCommande;
window.handleUpdateProfile = handleUpdateProfile;
window.uploadAvatar = uploadAvatar;
window.ouvrirSuivi = ouvrirSuivi;
window.fermerTracking = fermerTracking;
window.annulerCommande = annulerCommande;

function ouvrirSignalementLitige(id) {
    document.getElementById('litige-order-id').value = id;
    document.getElementById('litige-order-display').value = `#BW-${id}`;
    document.getElementById('litige-description').value = '';
    document.getElementById('litige-modal').style.display = 'flex';
}

function fermerLitigeModal() {
    document.getElementById('litige-modal').style.display = 'none';
}

async function declarerLitige(e) {
    e.preventDefault();
    const id = document.getElementById('litige-order-id').value;
    const description = document.getElementById('litige-description').value;

    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi...';

    const res = await api.post(`/commandes/${id}/litige`, { description });
    if (res.ok) {
        toast(res.data.message || 'Réclamation enregistrée !', 'succes');
        fermerLitigeModal();
    } else {
        toast(res.data.message || 'Erreur lors du signalement.', 'erreur');
    }

    btn.disabled = false;
    btn.innerHTML = originalText;
}

window.ouvrirSignalementLitige = ouvrirSignalementLitige;
window.fermerLitigeModal = fermerLitigeModal;
window.declarerLitige = declarerLitige;

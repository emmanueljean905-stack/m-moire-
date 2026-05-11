// ============================================================
// BEAUTIFUL WOMEN - Logique Panier (panier-page.js)
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    renderPanier();
});

function renderPanier() {
    const container = document.getElementById('cart-container');
    const items = panier.get();
    const total = panier.getTotal();

    if (items.length === 0) {
        container.innerHTML = `
            <div class="empty-cart" style="grid-column: 1 / -1;">
                <i class="fas fa-shopping-basket"></i>
                <h2>Votre panier est vide</h2>
                <p>Découvrez nos magnifiques pagnes dans le catalogue.</p>
                <a href="catalogue.html" class="btn btn-primary" style="margin-top:20px;">Voir le catalogue</a>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="cart-items-section">
            <h2 style="margin-bottom:20px; color:var(--brun)">Mon Panier (${items.length})</h2>
            <div class="cart-items">
                ${items.map(item => {
                    const imgUrl = api.getImageUrl(item.image || item.images);
                    return `
                    <div class="cart-item">
                        <div class="cart-item-img">
                            <img src="${imgUrl}" alt="${item.nom}">
                        </div>
                        <div class="cart-item-info">
                            <h4>${item.nom}</h4>
                            <p>Vendu par : <strong>${item.boutique || 'Beautiful Women'}</strong></p>
                        </div>
                        <div class="cart-item-price">
                            ${api.formatPrice(item.prix)}
                        </div>
                        <div class="quantity-selector">
                            <button class="quantity-btn" onclick="modifierQuantite(${item.id}, -1)">-</button>
                            <input type="text" class="quantity-input" value="${item.quantite}" readonly>
                            <button class="quantity-btn" onclick="modifierQuantite(${item.id}, 1)">+</button>
                        </div>
                        <button class="nav-icon-btn" onclick="supprimerItem(${item.id})" style="color:var(--rouge)">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                `}).join('')}
            </div>

            <div class="checkout-section">
                <h3>Informations de livraison</h3>
                
                <div class="form-group" style="margin-bottom:20px;">
                    <label>Zone de livraison</label>
                    <select id="checkout-zone" class="sort-select" style="width:100%; padding:12px; border-radius:12px;" onchange="updateLivraisonFee()">
                        <option value="">Chargement des zones...</option>
                    </select>
                </div>

                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:20px;">
                    <div class="form-group">
                        <label>Quartier</label>
                        <div class="input-with-icon">
                            <i class="fas fa-map"></i>
                            <input type="text" id="checkout-quartier" placeholder="Ex: Riviera 3" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Rue / Porte</label>
                        <div class="input-with-icon">
                            <i class="fas fa-road"></i>
                            <input type="text" id="checkout-rue" placeholder="Ex: Rue du Lycée" required>
                        </div>
                    </div>
                </div>
                
                <h3 style="margin-top:30px">Mode de paiement</h3>
                <div class="payment-methods">
                    <div class="payment-method active" onclick="selectPayment(this, 'orange')">
                        <img src="images/payment-orange.png" alt="Orange Money">
                        <span>Orange Money</span>
                    </div>
                    <div class="payment-method" onclick="selectPayment(this, 'mtn')">
                        <img src="images/payment-mtn.png" alt="MTN Money">
                        <span>MTN Money</span>
                    </div>
                    <div class="payment-method" onclick="selectPayment(this, 'wave')">
                        <img src="images/payment-wave.png" alt="Wave">
                        <span>Wave</span>
                    </div>
                    <div class="payment-method" onclick="selectPayment(this, 'moov')">
                        <img src="images/payment-moov.png" alt="Moov Money">
                        <span>Moov Money</span>
                    </div>
                </div>
            </div>
        </div>

        <div class="cart-summary-section">
            <div class="cart-summary">
                <h3 style="margin-bottom:20px; color:var(--or)">Résumé</h3>
                <div class="summary-row">
                    <span>Sous-total</span>
                    <span>${api.formatPrice(total)}</span>
                </div>
                <div class="summary-row">
                    <span>Livraison</span>
                    <span id="summary-livraison">--</span>
                </div>
                <div class="summary-total">
                    <div class="summary-row" style="margin-bottom:0">
                        <span>TOTAL</span>
                        <span id="summary-total">${api.formatPrice(total)}</span>
                    </div>
                </div>
                <button class="btn btn-primary" style="width:100%; margin-top:30px; padding:15px; font-size:1.1rem;" onclick="passerCommande()">
                    Confirmer la commande <i class="fas fa-arrow-right"></i>
                </button>
                <p style="font-size:0.75rem; text-align:center; margin-top:15px; opacity:0.7">
                    Paiement sécurisé via CinetPay
                </p>
            </div>
        </div>
    `;

    loadZones();
}

/** Charger les zones depuis l'API */
let availableZones = [];
async function loadZones() {
    const select = document.getElementById('checkout-zone');
    if (!select) return;

    try {
        const res = await api.get('/livraison/zones');
        if (res.ok) {
            availableZones = res.data.zones;
            select.innerHTML = '<option value="">-- Choisir une zone --</option>' + 
                availableZones.map(z => `
                    <option value="${z.id}" data-frais="${z.frais}">
                        ${z.nom} - ${api.formatPrice(z.frais)}
                    </option>
                `).join('');
        } else {
            select.innerHTML = '<option value="">Erreur de chargement</option>';
        }
    } catch (err) {
        select.innerHTML = '<option value="">Erreur de connexion</option>';
    }
}

/** Mettre à jour les frais de livraison dynamiquement */
function updateLivraisonFee() {
    const select = document.getElementById('checkout-zone');
    if (!select) return;
    
    const selectedOption = select.options[select.selectedIndex];
    const fee = parseInt(selectedOption.getAttribute('data-frais')) || 0;
    const subtotal = panier.getTotal();
    
    const summaryLiv = document.getElementById('summary-livraison');
    const summaryTotal = document.getElementById('summary-total');
    
    if (summaryLiv) summaryLiv.textContent = api.formatPrice(fee);
    if (summaryTotal) summaryTotal.textContent = api.formatPrice(subtotal + fee);
}

/** Modifier la quantité d'un produit */
function modifierQuantite(id, delta) {
    const item = panier.get().find(i => i.id === id);
    if (item) {
        const nouvelleQuantite = item.quantite + delta;
        if (nouvelleQuantite <= 0) {
            supprimerItem(id);
        } else {
            panier.modifierQuantite(id, nouvelleQuantite);
            renderPanier();
        }
    }
}

/** Supprimer un produit du panier */
function supprimerItem(id) {
    panier.retirer(id);
    renderPanier();
    toast('Produit retiré du panier');
}

/** Sélectionner un mode de paiement */
let selectedPayment = 'orange';
function selectPayment(el, method) {
    document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('active'));
    el.classList.add('active');
    selectedPayment = method;
}

/** Passer la commande (Directe sans simulation) */
async function passerCommande() {
    if (!session.estConnecte()) {
        toast('Veuillez vous connecter pour commander', 'erreur');
        setTimeout(() => window.location.href = 'auth.html?mode=login', 2000);
        return;
    }

    const zoneSelect = document.getElementById('checkout-zone');
    const quartier = document.getElementById('checkout-quartier')?.value?.trim();
    const rue = document.getElementById('checkout-rue')?.value?.trim();

    if (!zoneSelect.value) {
        toast('Veuillez sélectionner une zone de livraison', 'erreur');
        return;
    }
    if (!quartier || !rue) {
        toast('Veuillez renseigner votre quartier et votre rue', 'erreur');
        return;
    }

    const btn = document.querySelector('.cart-summary .btn-primary');
    const originalText = btn.innerHTML;
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Traitement...';
    
    const adresseComplete = `${quartier}, ${rue}`;

    const items = panier.get();
    const commandeData = {
        articles: items.map(i => ({ id_produit: i.id, quantite: i.quantite })),
        id_zone_livraison: zoneSelect.value,
        adresse_liv: adresseComplete,
        methode_paiement: selectedPayment
    };

    try {
        const res = await api.post('/commandes', commandeData);
        if (res.ok) {
            toast('Commande confirmée ! Redirection...', 'succes');
            panier.vider();
            setTimeout(() => window.location.href = `confirmation.html?id=${res.data.commande_id}`, 1500);
        } else {
            toast(res.data.message || 'Erreur lors de la validation', 'erreur');
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    } catch (err) {
        toast('Erreur de connexion au serveur', 'erreur');
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

window.passerCommande = passerCommande;
window.modifierQuantite = modifierQuantite;
window.supprimerItem = supprimerItem;
window.selectPayment = selectPayment;
window.updateLivraisonFee = updateLivraisonFee;

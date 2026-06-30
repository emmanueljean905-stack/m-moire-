// ============================================================
// BEAUTIFUL WOMEN - UI Helpers (Partagés)
// ============================================================

/** Générer les étoiles HTML à partir d'une note (0-5) */
function etoilesHTML(note) {
    const plein = Math.floor(note);
    const demi  = note % 1 >= 0.5 ? 1 : 0;
    const vide  = 5 - plein - demi;
    return '<span class="stars">' + '★'.repeat(plein) + (demi ? '½' : '') + '☆'.repeat(vide) + '</span>';
}

/** Toggler un produit en favoris (UI + LocalStorage) */
function toggleFavori(btn, idProduit) {
    const icon = btn.querySelector('i');
    const estFavori = btn.classList.toggle('active');
    icon.className = estFavori ? 'fas fa-heart' : 'far fa-heart';
    icon.style.color = estFavori ? 'var(--orange)' : '';

    let favoris = JSON.parse(localStorage.getItem('bw_favoris') || '[]');
    if (estFavori) {
        if (!favoris.includes(idProduit)) favoris.push(idProduit);
        toast('Ajouté aux favoris ❤️');
    } else {
        favoris = favoris.filter(id => id !== idProduit);
        toast('Retiré des favoris', 'erreur');
    }
    localStorage.setItem('bw_favoris', JSON.stringify(favoris));
}

/** Rendre un bouton favori actif si déjà dans localStorage */
function initFavoriBtn(btn, idProduit) {
    const favoris = JSON.parse(localStorage.getItem('bw_favoris') || '[]');
    if (favoris.includes(idProduit)) {
        btn.classList.add('active');
        const icon = btn.querySelector('i');
        icon.className = 'fas fa-heart';
        icon.style.color = 'var(--orange)';
    }
}

/** Ajouter un produit au panier (depuis une carte produit) */
function ajouterAuPanier(produit) {
    panier.ajouter(produit, 1);
}

/** Lancer une recherche globale */
function lancerRecherche() {
    const q = document.getElementById('search-input')?.value?.trim();
    if (q) {
        if (window.location.pathname.includes('catalogue.html') && typeof appliquerFiltres === 'function') {
            appliquerFiltres();
        } else {
            window.location.href = `catalogue.html?recherche=${encodeURIComponent(q)}`;
        }
    }
}

// Recherche avec Enter
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('search-input')?.addEventListener('keydown', e => {
        if (e.key === 'Enter') lancerRecherche();
    });
});

// Update Navbar Auth
function majNavbarAuth() {
    const user = session.getUser();
    const navAuth = document.getElementById('nav-auth');
    if (!navAuth) return;

    if (user) {
        navAuth.innerHTML = `
            <div class="user-logged-nav">
                <a href="${user.role === 'vendeur' ? 'vendeur-dashboard.html' : (user.role === 'admin' ? 'admin-dashboard.html' : 'profil.html')}" class="user-nav-link">
                     <i class="fas fa-user-circle"></i> <span>Mon Compte</span>
                </a>
            </div>
        `;
    }
}

/** Système de Reveal au Scroll */
function initScrollReveal() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// Gestion globale des images cassées
window.addEventListener('error', function(e) {
    if (e.target.tagName === 'IMG') {
        const placeholder = 'images/placeholder-pagne.jpg';
        if (e.target.src !== window.location.origin + '/' + placeholder && !e.target.src.endsWith(placeholder)) {
            e.target.src = placeholder;
            e.target.style.objectFit = 'contain';
            e.target.style.background = 'var(--creme-d)';
        }
    }
}, true);

document.addEventListener('DOMContentLoaded', () => {
    majNavbarAuth();
    initScrollReveal();

    // Mettre à jour les boutons du menu mobile selon la session
    const mobileAuthDiv = document.getElementById('mobile-auth-btns');
    if (mobileAuthDiv && typeof session !== 'undefined' && session && session.estConnecte()) {
        const user = session.getUser();
        const dest = user.role === 'vendeur' ? 'vendeur-dashboard.html' : user.role === 'admin' ? 'admin-dashboard.html' : 'profil.html';
        mobileAuthDiv.innerHTML = `
            <a href="${dest}" class="btn btn-primary" style="flex:1; justify-content:center;">
                <i class="fas fa-user"></i> Mon espace
            </a>
            <button class="btn btn-outline" onclick="session.deconnecter()" style="flex:1; color:var(--orange); border-color:var(--orange);">
                <i class="fas fa-sign-out-alt"></i> Déconnexion
            </button>`;
    }

    // Fermer le menu mobile si on clique en dehors
    document.addEventListener('click', (e) => {
        const menu = document.getElementById('mobile-menu');
        const btn = document.getElementById('hamburger-btn');
        if (menu && menu.classList.contains('open') && !menu.contains(e.target) && !btn.contains(e.target)) {
            closeMobileMenu();
        }
    });
});

// === MENU HAMBURGER MOBILE ===
function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    const btn = document.getElementById('hamburger-btn');
    if (menu && btn) {
        menu.classList.toggle('open');
        btn.classList.toggle('open');
    }
}
function closeMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    const btn = document.getElementById('hamburger-btn');
    if (menu && btn) {
        menu.classList.remove('open');
        btn.classList.remove('open');
    }
}

// ABONNEMENT NEWSLETTER
async function abonnerNewsletter(e) {
    e.preventDefault();
    const email = document.getElementById('newsletter-email').value;
    if (email) {
        toast(`Merci ! L'adresse ${email} est désormais inscrite.`);
        e.target.reset();
    }
}

// CONTACT FORM HANDLER
async function handleContactForm(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    const data = {
        nom: document.getElementById('contact-nom').value,
        email: document.getElementById('contact-email').value,
        sujet: document.getElementById('contact-sujet').value,
        message: document.getElementById('contact-message').value
    };
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi...';
    try {
        const res = await api.post('/support/contact', data);
        if (res.ok) {
            toast('Message envoyé !', 'succes');
            e.target.reset();
        }
    } catch (e) {}
    btn.disabled = false;
    btn.innerHTML = originalText;
}

// Exposer globalement
window.etoilesHTML      = etoilesHTML;
window.toggleFavori     = toggleFavori;
window.initFavoriBtn    = initFavoriBtn;
window.ajouterAuPanier  = ajouterAuPanier;
window.lancerRecherche  = lancerRecherche;
window.majNavbarAuth    = majNavbarAuth;
window.initScrollReveal = initScrollReveal;
window.abonnerNewsletter = abonnerNewsletter;
window.handleContactForm = handleContactForm;
window.toggleMobileMenu  = toggleMobileMenu;
window.closeMobileMenu   = closeMobileMenu;
// (L'assistant Adjoua est chargé via js/chatbot.js)

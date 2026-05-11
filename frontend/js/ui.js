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
                <a href="${user.role === 'vendeur' ? 'vendeur-dashboard.html' : 'profil.html'}" class="user-nav-link">
                    <i class="fas fa-user-circle"></i> <span>Mon Compte</span>
                </a>
                <button onclick="session.deconnecter()" class="nav-icon-btn logout-btn" title="Déconnexion">
                    <i class="fas fa-sign-out-alt"></i>
                </button>
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
});

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
// (L'assistant Adjoua est chargé via js/chatbot.js)

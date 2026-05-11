// ============================================================
// BEAUTIFUL WOMEN - Logique Authentification (auth.js)
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    // Vérifier si l'utilisateur est déjà connecté
    if (session.estConnecte()) {
        window.location.href = 'index.html';
        return;
    }

    // Gestion du mode via l'URL (ex: auth.html?mode=register)
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    if (mode === 'register') {
        switchTab('register');
    }
    if (params.get('role') === 'vendeur') {
        selectRole('vendeur');
    }
});

/** Basculer entre Connexion et Inscription */
function switchTab(tab) {
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const formLogin = document.getElementById('form-login');
    const formRegister = document.getElementById('form-register');
    const title = document.getElementById('auth-title');
    const subtitle = document.getElementById('auth-subtitle');
    const footer = document.getElementById('auth-footer-text');

    if (tab === 'login') {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        formLogin.style.display = 'block';
        formRegister.style.display = 'none';
        title.textContent = 'Se connecter';
        subtitle.textContent = 'Accédez à votre espace Beautiful Women';
        footer.innerHTML = `Vous n'avez pas de compte ? <a href="#" onclick="switchTab('register')">S'inscrire</a>`;
    } else {
        tabLogin.classList.remove('active');
        tabRegister.classList.add('active');
        formLogin.style.display = 'none';
        formRegister.style.display = 'block';
        title.textContent = "S'inscrire";
        subtitle.textContent = 'Créez votre compte en quelques secondes';
        footer.innerHTML = `Vous avez déjà un compte ? <a href="#" onclick="switchTab('login')">Se connecter</a>`;
    }
}

/** Sélectionner le rôle (Acheteur / Vendeur) */
function selectRole(role) {
    const btnAcheteur = document.getElementById('role-acheteur');
    const btnVendeur = document.getElementById('role-vendeur');
    const sellerFields = document.getElementById('seller-fields');
    const roleInput = document.getElementById('reg-role');

    roleInput.value = role;

    if (role === 'acheteur') {
        btnAcheteur.classList.add('active');
        btnVendeur.classList.remove('active');
        sellerFields.style.display = 'none';
        // Retirer le required des champs de vendeur
        document.getElementById('reg-boutique').required = false;
        document.getElementById('reg-loc').required = false;
    } else {
        btnAcheteur.classList.remove('active');
        btnVendeur.classList.add('active');
        sellerFields.style.display = 'block';
        // Ajouter le required
        document.getElementById('reg-boutique').required = true;
        document.getElementById('reg-loc').required = true;
    }
}

/** Gérer la connexion */
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const mot_de_passe = document.getElementById('login-password').value;

    const btn = e.target.querySelector('button');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion en cours...';
    btn.disabled = true;

    const res = await api.post('/auth/connexion', { email, mot_de_passe });

    if (res.ok && res.data.token) {
        session.connecter(res.data.token, res.data.utilisateur);
        toast(res.data.message || 'Vous êtes connecté ! 🌺');
        
        // Redirection intelligente selon le rôle
        setTimeout(() => {
            if (res.data.utilisateur.role === 'vendeur') {
                window.location.href = 'vendeur-dashboard.html';
            } else {
                window.location.href = 'index.html';
            }
        }, 1500);
        return; // Éviter toute exécution supplémentaire
    } else {
        toast(res.data.message || 'Email ou mot de passe incorrect.', 'erreur');
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

/** Gérer l'inscription */
async function handleRegister(e) {
    e.preventDefault();

    const role = document.getElementById('reg-role').value;
    const nom = document.getElementById('reg-nom').value;
    const email = document.getElementById('reg-email').value;
    const telephone = document.getElementById('reg-tel').value;
    const mot_de_passe = document.getElementById('reg-password').value;

    const data = { role, nom, email, telephone, mot_de_passe };

    if (role === 'vendeur') {
        data.nom_boutique = document.getElementById('reg-boutique').value;
        data.localisation = document.getElementById('reg-loc').value;
    }

    const btn = e.target.querySelector('button');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inscription en cours...';
    btn.disabled = true;

    const res = await api.post('/auth/inscription', data);

    if (res.ok && res.data.token) {
        session.connecter(res.data.token, res.data.utilisateur);
        toast(res.data.message || 'Bienvenue sur Beautiful Women ! ✨');
        
        setTimeout(() => {
            if (role === 'vendeur') {
                window.location.href = 'vendeur-dashboard.html';
            } else {
                window.location.href = 'index.html';
            }
        }, 1500);
        return;
    } else {
        toast(res.data.message || 'Une erreur est survenue lors de l\'inscription.', 'erreur');
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// Exposer globalement
window.switchTab = switchTab;
window.selectRole = selectRole;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;

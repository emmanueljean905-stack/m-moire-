// ============================================================
// BEAUTIFUL WOMEN - Logique Authentification (auth.js)
// Rôle : Piloter l'interface utilisateur de la page d'authentification.
//        Gère le basculement d'onglets (Connexion / Inscription),
//        l'affichage conditionnel des formulaires (Acheteur / Vendeur),
//        les soumissions de formulaires API et les redirections après succès.
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Redirection de sécurité : Si l'utilisateur possède déjà une session active,
    //    il n'a rien à faire sur la page de connexion et est redirigé vers l'accueil.
    if (session.estConnecte()) {
        window.location.href = 'index.html';
        return;
    }

    // 2. Traitement des paramètres d'URL
    //    Permet d'ouvrir directement l'onglet d'inscription ou de pré-remplir le rôle de vendeur.
    //    Exemple : auth.html?mode=register&role=vendeur
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    if (mode === 'register') {
        switchTab('register'); // Affiche directement le formulaire d'inscription
    }
    if (params.get('role') === 'vendeur') {
        selectRole('vendeur'); // Active par défaut le profil vendeur
    }
});

/**
 * Basculer l'affichage entre Connexion et Inscription.
 * Modifie les classes CSS actives, les balises de titre et le texte de bas de page.
 * 
 * @param {String} tab - Cible de basculement ('login' ou 'register')
 */
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

/**
 * Activer les champs de saisie selon le rôle choisi à l'inscription.
 * Si le rôle est "vendeur", affiche les champs spécifiques à la boutique (nom de boutique, localisation)
 * et les rend requis (`required = true`). S'il s'agit d'un "acheteur", ces champs sont masqués.
 * 
 * @param {String} role - Rôle choisi ('acheteur' ou 'vendeur')
 */
function selectRole(role) {
    const btnAcheteur = document.getElementById('role-acheteur');
    const btnVendeur = document.getElementById('role-vendeur');
    const sellerFields = document.getElementById('seller-fields');
    const roleInput = document.getElementById('reg-role');

    roleInput.value = role; // Stocke la valeur du rôle dans un input caché pour l'envoi du formulaire

    if (role === 'acheteur') {
        btnAcheteur.classList.add('active');
        btnVendeur.classList.remove('active');
        sellerFields.style.display = 'none'; // Masquer les champs vendeur
        
        // Retirer la contrainte de validation HTML5 sur les champs cachés
        document.getElementById('reg-boutique').required = false;
        document.getElementById('reg-loc').required = false;
    } else {
        btnAcheteur.classList.remove('active');
        btnVendeur.classList.add('active');
        sellerFields.style.display = 'block'; // Afficher les champs boutique
        
        // Activer la contrainte de saisie sur ces champs
        document.getElementById('reg-boutique').required = true;
        document.getElementById('reg-loc').required = true;
    }
}

/**
 * Gérer la soumission du formulaire de Connexion.
 * 
 * @param {Event} e - Événement de soumission de formulaire
 */
async function handleLogin(e) {
    e.preventDefault(); // Bloquer le rechargement par défaut de la page
    
    const email = document.getElementById('login-email').value;
    const mot_de_passe = document.getElementById('login-password').value;

    // Animation visuelle de chargement sur le bouton
    const btn = e.target.querySelector('button');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion en cours...';
    btn.disabled = true;

    // Envoi de la requête POST au backend via api.js
    const res = await api.post('/auth/connexion', { email, mot_de_passe });

    if (res.ok && res.data.token) {
        // Enregistrer le token JWT et les données de session en local
        session.connecter(res.data.token, res.data.utilisateur);
        toast(res.data.message || 'Connexion réussie ! 🌺');
        
        // Redirection vers le tableau de bord ou l'accueil après un court délai pour l'affichage du toast
        setTimeout(() => {
            if (res.data.utilisateur.role === 'vendeur') {
                window.location.href = 'vendeur-dashboard.html';
            } else if (res.data.utilisateur.role === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else {
                window.location.href = 'index.html';
            }
        }, 1500);
        return;
    } else {
        // En cas d'erreur de connexion (mauvais mot de passe, email absent, etc.)
        toast(res.data.message || 'Adresse e-mail ou mot de passe incorrect.', 'erreur');
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

/**
 * Gérer la soumission du formulaire d'Inscription.
 * 
 * @param {Event} e - Événement de soumission de formulaire
 */
async function handleRegister(e) {
    e.preventDefault(); // Bloquer le rechargement de la page

    const role = document.getElementById('reg-role').value;
    const nom = document.getElementById('reg-nom').value;
    const email = document.getElementById('reg-email').value;
    const telephone = document.getElementById('reg-tel').value;
    const mot_de_passe = document.getElementById('reg-password').value;

    // Constitution de l'objet de données de l'inscription
    const data = { role, nom, email, telephone, mot_de_passe };

    // Si vendeur, attacher les variables de boutique au payload
    if (role === 'vendeur') {
        data.nom_boutique = document.getElementById('reg-boutique').value;
        data.localisation = document.getElementById('reg-loc').value;
    }

    // Animation visuelle de chargement sur le bouton
    const btn = e.target.querySelector('button');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Création du compte...';
    btn.disabled = true;

    // Envoi de la requête POST d'inscription au backend
    const res = await api.post('/auth/inscription', data);

    if (res.ok && res.data.token) {
        // Initialiser la session de connexion
        session.connecter(res.data.token, res.data.utilisateur);
        toast(res.data.message || 'Inscription réussie, bienvenue ! ✨');
        
        // Redirection différée selon le rôle
        setTimeout(() => {
            if (role === 'vendeur') {
                window.location.href = 'vendeur-dashboard.html';
            } else {
                window.location.href = 'index.html';
            }
        }, 1500);
        return;
    } else {
        // En cas d'échec de la création (ex: e-mail déjà utilisé)
        toast(res.data.message || 'Une erreur est survenue lors de la création de votre compte.', 'erreur');
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

// Exposition des fonctions au niveau global (window) pour que les attributs HTML onclick puissent les invoquer
window.switchTab = switchTab;
window.selectRole = selectRole;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;

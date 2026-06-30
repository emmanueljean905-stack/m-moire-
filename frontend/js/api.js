// ============================================================
// BEAUTIFUL WOMEN - Client API & Gestion de Session (Frontend)
// Rôle : Configurer et centraliser toutes les requêtes réseau (Fetch)
//        vers le serveur backend, gérer la session utilisateur (JWT)
//        et fournir des utilitaires globaux (formatage de prix, toasts).
// ============================================================

// ── GESTION GLOBALE DES ERREURS JAVASCRIPT ────────────────────
// Permet de capturer et logger discrètement les erreurs JS du navigateur
// dans la console de développement, évitant les alertes bloquantes à l'écran.
window.onerror = function(msg, url, line) {
    console.error(`[JS Error] ${msg} @ ${url}:${line}`);
    return true; // Empêche l'affichage du dialogue d'erreur natif du navigateur
};

// ── DÉTERMINATION DYNAMIQUE DE L'URL BACKEND ───────────────────
// Permet de configurer l'URL cible de l'API automatiquement, que le site
// soit hébergé en local, sur une adresse IP de réseau local ou en ligne.
const getBackendUrl = () => {
    const { protocol, hostname, port, origin } = window.location;
    
    // Si on accède directement via le port 3000 (Express servant le frontend)
    if (port === '3000') return origin;
    
    // Toujours cibler HTTP pour le port 3000 du serveur Node local,
    // car le serveur Express local n'utilise pas HTTPS en développement.
    const backendProtocol = 'http:';
    
    // Vérification des hôtes locaux (localhost, 127.0.0.1, adresses IP privées de réseau local)
    const isLocal = hostname === 'localhost' || 
                    hostname === '127.0.0.1' || 
                    hostname === '[::1]' || 
                    hostname === '::1' || 
                    hostname.startsWith('192.168.') || 
                    hostname.startsWith('10.') || 
                    hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./);
                    
    if (isLocal) {
        return `${backendProtocol}//${hostname}:3000`;
    }
    
    // Valeur de repli (cible l'origine actuelle pour la production ou les tunnels)
    return origin;
};

const BACKEND_URL = getBackendUrl();
const API_BASE = `${BACKEND_URL}/api`;

console.log(`🌐 Beautiful Women - Backend URL: ${BACKEND_URL}`);

// ── DIAGNOSTIC DE SANTÉ DU SERVEUR (HEALTH CHECK) ──────────────
// Vérifie si le serveur Node.js et MySQL sont actifs et fonctionnels.
async function checkBackendHealth() {
    // Avertissement de sécurité si l'utilisateur tente d'ouvrir le fichier HTML en direct (file://)
    if (window.location.protocol === 'file:') {
        showErrorBanner('🚨 **ERREUR PROTOCOLE** : Veuillez ouvrir l\'application via XAMPP (`http://localhost/memoire 1/frontend/`) et non en double-cliquant sur le fichier HTML.');
        return;
    }

    try {
        // Définition d'un timeout de 5 secondes pour ne pas figer l'interface utilisateur
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${API_BASE}/debug-status`, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        const data = await response.json();
        
        if (data.serveur === 'ok') {
            if (data.base_de_donnees === 'error') {
                // Avertir si le serveur Node répond mais que la base MySQL est éteinte sous XAMPP
                showErrorBanner(`**Serveur actif mais MySQL est arrêté.**<br><small style="opacity:0.9">Veuillez démarrer le module MySQL dans le panneau XAMPP.</small>`);
            } else {
                console.log('✅ Backend & MySQL : OK');
                hideErrorBanner();
            }
        }
    } catch (err) {
        if (err.name === 'AbortError') {
            showErrorBanner('**Le serveur Node ne répond pas (délai dépassé).**<br><small style="opacity:0.9">Vérifiez que "npm start" est bien en cours d\'exécution dans le dossier backend.</small>');
        } else {
            showErrorBanner('**Impossible de contacter le serveur backend.**<br><small style="opacity:0.9">Vérifiez que MySQL est lancé dans XAMPP et que le serveur Node est démarré.</small>');
        }
    }
}

// Gestion des bandeaux d'erreur globale
function showErrorBanner(msg) {
    // Désactivé à la demande de l'utilisateur pour éviter les alertes intrusives
    const banner = document.getElementById('server-error-banner');
    if (banner) banner.remove();
}

function hideErrorBanner() {
    const banner = document.getElementById('server-error-banner');
    if (banner) banner.remove();
}

// Surveillance réseau en continu : vérification initiale et répétée toutes les 30 secondes
document.addEventListener('DOMContentLoaded', () => {
    checkBackendHealth();
    setInterval(checkBackendHealth, 30000); 
});

// ── ENCAPSULATION DES REQUÊTES HTTP (API FETCH WRAPPER) ────────
// Cette fonction centralise la gestion des requêtes réseau (Headers, Tokens JWT, Redirection, Erreurs).
async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem('bw_token'); // Récupération du jeton JWT de session
    const isFormData = options.body instanceof FormData; // Détection du téléversement de formulaires physiques
    
    // Assemblage automatique des en-têtes de sécurité et de type de contenu
    const headers = {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}), // Attacher le jeton JWT si présent
        'Bypass-Tunnel-Reminder': 'true', // Évite que localtunnel ne bloque les requêtes API AJAX avec sa page de garde
        ...options.headers
    };
    
    try {
        const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
        const response = await fetch(url, { ...options, headers });
        
        hideErrorBanner(); // En cas de succès d'une requête, on masque le bandeau d'erreur (serveur vivant)

        const data = await response.json();
        
        // Si le token est expiré ou invalide (Erreur 403), déconnecter automatiquement
        if (response.status === 403 && data.message?.includes('Token')) {
            session.deconnecter();
            return;
        }
        return { ok: response.ok, status: response.status, data };
    } catch (err) {
        console.error(`❌ Erreur API [${endpoint}] :`, err);
        showErrorBanner('Connexion au serveur impossible. Vérifiez que MySQL et le serveur Node sont lancés.');
        return { ok: false, status: 0, data: { message: 'Serveur injoignable ou erreur réseau.' } };
    }
}

// Service API exporté globalement contenant les raccourcis des verbes HTTP
const api = {
    get:         (url)      => apiFetch(url, { method: 'GET' }),
    post:        (url, b)   => apiFetch(url, { method: 'POST', body: b instanceof FormData ? b : JSON.stringify(b) }),
    put:         (url, b)   => apiFetch(url, { method: 'PUT',  body: JSON.stringify(b) }),
    delete:      (url)      => apiFetch(url, { method: 'DELETE' }),
    
    /** Formatage de prix localisé en FCFA (ex: 15000 -> 15 000 FCFA) */
    formatPrice: (m) => new Intl.NumberFormat('fr-CI', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(m),
    
    /** Traduction du chemin relatif d'une image en URL absolue vers le backend */
    getImageUrl: (path) => window.getImageUrl(path)
};

// ── COMPORTEMENT DE SESSION UTILISATEUR ───────────────────────
// Gère l'état d'authentification de l'utilisateur courant en s'appuyant
// sur le stockage persistant LocalStorage du navigateur web.
const session = {
    // Connexion : Stocker le token JWT et le profil utilisateur
    connecter(t, u) { localStorage.setItem('bw_token', t); localStorage.setItem('bw_user', JSON.stringify(u)); },
    
    // Déconnexion : Purger les jetons et rediriger vers l'accueil
    deconnecter()   { localStorage.removeItem('bw_token'); localStorage.removeItem('bw_user'); window.location.href = 'index.html'; },
    
    // Récupérer le profil utilisateur connecté
    getUser()       { const u = localStorage.getItem('bw_user'); return u ? JSON.parse(u) : null; },
    
    // Tester si l'utilisateur est authentifié
    estConnecte()   { return !!localStorage.getItem('bw_token'); },
    
    // Vérifier les droits d'accès
    estVendeur()    { return this.getUser()?.role === 'vendeur'; },
    estAdmin()      { return this.getUser()?.role === 'admin'; }
};

// ── TOASTS D'ALERTES DYNAMIQUES (NOTIFICATIONS UI) ─────────────
// Affiche une bulle de notification temporaire sur la page.
function toast(msg, type = 'succes') {
    const c = document.getElementById('toast-container');
    if (!c) return;
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<span>${type === 'succes' ? '✅' : '❌'}</span> <span>${msg}</span>`;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3600); // Destruction de l'alerte après 3.6 secondes
}

// Exposition au scope global (window) pour y avoir accès dans toutes les pages
window.api = api;
window.session = session;
window.toast = toast;

// ── NORMALISATION ET CONSTRUCTION DE L'URL D'IMAGE ────────────
// Assure que l'application affiche toujours une image valide.
// Gère les valeurs vides, les tableaux d'images encodés en JSON,
// et reconstruit l'URL pointant vers le dossier uploads/ du serveur Express.
window.getImageUrl = function(path) {
    // Si l'image n'est pas renseignée
    if (!path || path === 'null' || path === 'undefined' || (typeof path === 'object' && Object.keys(path).length === 0)) {
        return 'images/placeholder-pagne.jpg'; // Image générique de remplacement
    }
    
    let strPath = String(path).trim();
    
    // Déballer le tableau JSON si l'image est stockée au format ["image.jpg"] ou {"image": "..."}
    if (strPath.startsWith('[') || strPath.startsWith('{')) {
        try {
            const parsed = JSON.parse(strPath);
            strPath = Array.isArray(parsed) ? parsed[0] : (typeof parsed === 'string' ? parsed : strPath);
        } catch(e) {}
    }

    if (!strPath || strPath === 'null' || strPath === 'undefined' || typeof strPath !== 'string') {
        return 'images/placeholder-pagne.jpg';
    }
    
    // Si l'image est déjà une URL absolue externe (ex: hébergée ailleurs en HTTP/HTTPS)
    if (strPath.startsWith('http')) return strPath;
    
    // 1. Normalisation des slashes de chemin Windows/Linux
    let clean = strPath.replace(/\\/g, '/').replace(/\/+/g, '/').trim();
    
    // 2. Retrait du slash initial pour éviter les doubles slashes
    if (clean.startsWith('/')) clean = clean.slice(1);
    
    // 3. S'assurer que le chemin d'accès commence bien par uploads/
    if (!clean.startsWith('uploads/')) {
        clean = 'uploads/' + clean;
    }
    
    // 4. Correction de sécurité anti-doublon (uploads/uploads/)
    clean = clean.replace(/^uploads\/uploads\//, 'uploads/');
    
    // Retourner l'URL absolue finale
    const finalUrl = `${BACKEND_URL}/${clean}`;
    return finalUrl;
};

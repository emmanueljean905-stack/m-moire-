// Gestion silencieuse des erreurs JS globales (console uniquement, pas de popup)
window.onerror = function(msg, url, line) {
    console.error(`[JS Error] ${msg} @ ${url}:${line}`);
    return true; // Empêche l'affichage du message d'erreur par défaut du navigateur
};

// Déterminer dynamiquement l'URL du backend
const getBackendUrl = () => {
    const { protocol, hostname, port, origin } = window.location;
    
    // Si on est déjà sur le port 3000 (ex: accès direct via Node)
    if (port === '3000') return origin;
    
    // Si on est sur localhost ou une IP locale, on pointe vers le backend Node sur 3000
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
        return `${protocol}//${hostname}:3000`;
    }
    
    // Fallback par défaut (port 3000 sur l'hôte actuel)
    return `${protocol}//${hostname}:3000`;
};

const BACKEND_URL = getBackendUrl();
const API_BASE = `${BACKEND_URL}/api`;

console.log(`🌐 Beautiful Women - Backend URL: ${BACKEND_URL}`);

/** Vérifier la santé du serveur au démarrage */
async function checkBackendHealth() {
    // Détection du protocole file://
    if (window.location.protocol === 'file:') {
        showErrorBanner('🚨 ERREUR CRITIQUE : Vous utilisez le protocole "file://". Double-cliquer sur le fichier ne fonctionne pas. Utilisez "http://localhost/memoire%201/frontend/" via XAMPP ou lancez le serveur Node.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/debug-status`);
        const data = await response.json();
        
        if (data.serveur === 'ok') {
            if (data.base_de_donnees === 'error') {
                showErrorBanner(`⚠️ Le serveur est lancé mais MySQL est inaccessible : ${data.erreur_db || 'Erreur DB'}`);
            } else {
                console.log('✅ Backend & Database: OK');
                hideErrorBanner();
            }
        }
    } catch (err) {
        showErrorBanner('❌ Connexion au serveur impossible. 1. MySQL doit être lancé dans XAMPP. 2. Tapez "npm run demo" dans le terminal du dossier backend.');
    }
}

function showErrorBanner(msg) {
    let banner = document.getElementById('server-error-banner');
    if (!banner) {
        banner = document.createElement('div');
        banner.id = 'server-error-banner';
        banner.style = "position:fixed; top:0; left:0; width:100%; background:#dc3545; color:white; text-align:center; padding:10px; z-index:10001; font-weight:bold; font-size:0.9rem; box-shadow:0 2px 10px rgba(0,0,0,0.2); transition: all 0.3s ease;";
        document.body.prepend(banner);
    }
    banner.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${msg}`;
    banner.style.display = 'block';
}

function hideErrorBanner() {
    const banner = document.getElementById('server-error-banner');
    if (banner) banner.style.display = 'none';
}

// Lancer le check au démarrage de chaque page
document.addEventListener('DOMContentLoaded', checkBackendHealth);

/** Centralized fetch helper */
async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem('bw_token');
    const isFormData = options.body instanceof FormData;
    const headers = {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options.headers
    };
    try {
        const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
        const response = await fetch(url, { ...options, headers });
        
        // Masquer le bandeau si une requête réussit (signe de vie)
        hideErrorBanner();

        const data = await response.json();
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

const api = {
    get:         (url)      => apiFetch(url, { method: 'GET' }),
    post:        (url, b)   => apiFetch(url, { method: 'POST', body: b instanceof FormData ? b : JSON.stringify(b) }),
    put:         (url, b)   => apiFetch(url, { method: 'PUT',  body: JSON.stringify(b) }),
    delete:      (url)      => apiFetch(url, { method: 'DELETE' }),
    
    /** Helper pour formater les prix en FCFA partout */
    formatPrice: (m) => new Intl.NumberFormat('fr-CI', { style: 'currency', currency: 'XOF', minimumFractionDigits: 0 }).format(m),
    
    /** Helper pour construire l'URL complète d'une image */
    getImageUrl: (path) => window.getImageUrl(path)
};

const session = {
    connecter(t, u) { localStorage.setItem('bw_token', t); localStorage.setItem('bw_user', JSON.stringify(u)); },
    deconnecter()   { localStorage.removeItem('bw_token'); localStorage.removeItem('bw_user'); window.location.href = 'index.html'; },
    getUser()       { const u = localStorage.getItem('bw_user'); return u ? JSON.parse(u) : null; },
    estConnecte()   { return !!localStorage.getItem('bw_token'); },
    estVendeur()    { return this.getUser()?.role === 'vendeur'; },
    estAdmin()      { return this.getUser()?.role === 'admin'; }
};

function toast(msg, type = 'succes') {
    const c = document.getElementById('toast-container');
    if (!c) return;
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<span>${type === 'succes' ? '✅' : '❌'}</span> <span>${msg}</span>`;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3600);
}

window.api = api;
window.session = session;
window.toast = toast;

/**
 * GESTION DES URLS D'IMAGES
 */
window.getImageUrl = function(path) {
    if (!path || path === 'null' || path === 'undefined' || (typeof path === 'object' && Object.keys(path).length === 0)) {
        return 'images/placeholder-pagne.jpg';
    }
    
    let strPath = String(path).trim();
    
    // Déballer le JSON si nécessaire (ex: "[\"image.jpg\"]")
    if (strPath.startsWith('[') || strPath.startsWith('{')) {
        try {
            const parsed = JSON.parse(strPath);
            strPath = Array.isArray(parsed) ? parsed[0] : (typeof parsed === 'string' ? parsed : strPath);
        } catch(e) {}
    }

    if (!strPath || strPath === 'null' || strPath === 'undefined' || typeof strPath !== 'string') {
        return 'images/placeholder-pagne.jpg';
    }
    
    if (strPath.startsWith('http')) return strPath;
    
    // 1. Normaliser slashes et nettoyer les espaces
    let clean = strPath.replace(/\\/g, '/').replace(/\/+/g, '/').trim();
    
    // 2. Retirer le slash au début si présent pour éviter double slash
    if (clean.startsWith('/')) clean = clean.slice(1);
    
    // 3. S'assurer que ça commence par uploads/ une seule fois
    if (!clean.startsWith('uploads/')) {
        clean = 'uploads/' + clean;
    }
    
    // 4. Construction finale : s'assurer qu'il n'y a pas de double uploads/uploads/
    clean = clean.replace(/^uploads\/uploads\//, 'uploads/');
    
    const finalUrl = `${BACKEND_URL}/${clean}`;
    return finalUrl;
};

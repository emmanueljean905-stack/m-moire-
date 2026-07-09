// ============================================================
// BEAUTIFUL WOMEN - Serveur Express Principal
// Rôle : Point d'entrée de l'application backend. Il configure
//        le framework Express, connecte les routeurs de l'API,
//        sert les fichiers statiques de l'interface client (frontend)
//        et gère les exceptions et erreurs globales.
// ============================================================

// Importation des modules système requis
const express     = require('express'); // Framework de routage HTTP et serveur d'application
const cors        = require('cors');    // Middleware permettant de gérer le partage de ressources cross-origin
const path        = require('path');    // Module utilitaire Node.js pour manipuler les chemins de fichiers
require('dotenv').config({ path: path.join(__dirname, '.env') }); // Charge .env depuis le dossier backend/

// Instanciation de l'application Express
const app = express();

// ============================================================
// MIDDLEWARES GLOBAUX
// ============================================================

// Configuration de CORS (Cross-Origin Resource Sharing)
// En développement : autorise tout. En production : restreint au domaine du frontend.
const corsOptions = {
    origin: (origin, callback) => {
        // En développement, ou si pas d'origin (appels server-to-server), tout autoriser
        if (process.env.NODE_ENV !== 'production' || !origin) {
            return callback(null, true);
        }
        // En production, n'autoriser que le(s) domaine(s) du frontend
        const allowed = (process.env.FRONTEND_URL || '').split(',').map(u => u.trim());
        if (allowed.includes(origin) || allowed.includes('*')) {
            callback(null, true);
        } else {
            callback(new Error(`CORS: Origine non autorisée : ${origin}`));
        }
    },
    credentials: true
};
app.use(cors(corsOptions));

// Analyseurs de requêtes (Body Parsers)
// Indispensables pour pouvoir lire les données envoyées par le client dans req.body.
app.use(express.json());                         // Lit et convertit les requêtes encodées en JSON
app.use(express.urlencoded({ extended: true })); // Lit et convertit les formulaires d'URL classique (x-www-form-urlencoded)

// Middleware personnalisé de log de requêtes pour faciliter le débogage
// Ce code intercepte chaque requête API entrante et l'imprime dans la console de développement.
app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
        console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
        // Masquer le mot de passe dans les logs de la console pour la sécurité des données utilisateur
        if (req.method === 'POST' || req.method === 'PUT') {
            const safeBody = { ...req.body };
            if (safeBody.mot_de_passe) safeBody.mot_de_passe = '***';
            console.log('Body:', safeBody);
        }
    }
    next(); // Poursuivre vers le middleware ou contrôleur correspondant
});

// Service des fichiers statiques du frontend
// Permet à Express de servir directement les pages HTML, styles CSS et scripts JS du site web.
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Exposition statique du dossier de téléversement des images.
// Permet aux navigateurs d'accéder directement aux images produits téléversées via /uploads/<nom-image>.jpg
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================================
// ROUTES API
// ============================================================
// Chargement de chacun des modules de routage
const authRoutes       = require('./routes/auth');       // Gestion des profils et de l'authentification
const produitsRoutes   = require('./routes/produits');   // Gestion du catalogue de produits et des stocks
const vendeursRoutes   = require('./routes/vendeurs');   // Gestion des boutiques et comptes des vendeurs
const commandesRoutes  = require('./routes/commandes');  // Gestion des commandes clients et des paniers
const categoriesRoutes = require('./routes/categories'); // Gestion des catégories de produits (ex: Couture, Tissu)
const avisRoutes       = require('./routes/avis');       // Évaluations et retours clients sur les articles
const uploadRoutes     = require('./routes/upload');     // Endpoints de chargement des médias physiques (images)
const livraisonRoutes  = require('./routes/livraison');  // Gestion des livraisons et des tarifs associés
const supportRoutes    = require('./routes/support');    // Gestion du support client et tickets
const adminRoutes      = require('./routes/admin');      // Espace administration de la plateforme

// Liaison des routeurs avec un préfixe commun "/api"
app.use('/api/auth',       authRoutes);
app.use('/api/produits',   produitsRoutes);
app.use('/api/vendeurs',   vendeursRoutes);
app.use('/api/commandes',  commandesRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/avis',       avisRoutes);
app.use('/api/upload',     uploadRoutes);
app.use('/api/livraison',  livraisonRoutes);
app.use('/api/support',    supportRoutes);
app.use('/api/admin',      adminRoutes);

// ============================================================
// ROUTES DE SANTÉ ET DEBUG (Health Check)
// ============================================================

// Endpoint simple pour tester si l'API est en ligne
app.get('/api/health', (req, res) => {
    res.json({
        statut: 'ok',
        message: '🌺 Beautiful Women API est en ligne',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// Endpoint de diagnostic plus poussé (test de la connexion MySQL active)
app.get('/api/debug-status', async (req, res) => {
    let dbStatus = 'ok';
    let dbError = null;
    try {
        const db = require('./config/db');
        // Tente d'emprunter une connexion au pool MySQL
        const conn = await db.getConnection();
        conn.release(); // Libère immédiatement la connexion pour éviter les fuites
    } catch (err) {
        dbStatus = 'error';
        dbError = err.message;
    }

    res.json({
        serveur: 'ok',
        base_de_donnees: dbStatus,
        erreur_db: dbError,
        env: process.env.NODE_ENV,
        port: PORT,
        uptime: process.uptime() // Temps d'activité du serveur Node en secondes
    });
});

// ============================================================
// REDIRIGER TOUTES LES AUTRES ROUTES VERS index.html (SPA)
// ============================================================
// Règle de redirection obligatoire pour les Single Page Applications (SPA).
// Si un utilisateur saisit un chemin inconnu ou recharge la page sur une route interne du frontend,
// le serveur renvoie d'office le point d'entrée "index.html". C'est ensuite le routeur JavaScript
// côté client (frontend) qui prend le relais pour afficher le bon contenu.
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// ============================================================
// GESTION GLOBALE DES ERREURS
// ============================================================
// Ce middleware intercepte toutes les erreurs générées dans les promesses
// ou les routes de l'API. Il empêche le crash brutal du serveur et retourne
// une réponse standardisée 500 JSON.
app.use((err, req, res, next) => {
    console.error('❌ Erreur serveur :', err.stack);
    res.status(500).json({
        succes: false,
        message: 'Une erreur interne est survenue sur le serveur.',
        // N'affiche le détail technique de l'erreur qu'en environnement de développement
        erreur: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ============================================================
// DÉMARRAGE DU SERVEUR
// ============================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`\n🌺 ===================================`);
    console.log(`   Beautiful Women API démarrée`);
    console.log(`   http://localhost:${PORT}`);
    console.log(`   Environnement : ${process.env.NODE_ENV}`);
    console.log(`===================================\n`);
});

// ============================================================
// STABILISATION : GESTION DES ERREURS DE PROCESSUS HORS EXPRESS
// ============================================================
// Intercepte les erreurs critiques jetées par le moteur Node.js qui ne sont pas interceptées
// par Express. Cela évite l'arrêt inattendu du service backend.
process.on('uncaughtException', (err) => {
    console.error('💥 ERREUR NON GÉRÉE (Processus) :', err.message);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ PROMESSE REJETÉE NON GÉRÉE :', reason);
});

module.exports = app;

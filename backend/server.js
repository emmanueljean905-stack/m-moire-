// ============================================================
// BEAUTIFUL WOMEN - Serveur Express Principal
// ============================================================
const express     = require('express');
const cors        = require('cors');
const path        = require('path');
require('dotenv').config();

const app = express();

// ============================================================
// MIDDLEWARES GLOBAUX
// ============================================================

// Autoriser les requêtes cross-origin (frontend ↔ backend)
app.use(cors({
    origin: true,
    credentials: true
}));

// Parser le JSON des requêtes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware de log pour le débogage
app.use((req, res, next) => {
    if (req.url.startsWith('/api')) {
        console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
        if (req.method === 'POST' || req.method === 'PUT') {
            const safeBody = { ...req.body };
            if (safeBody.mot_de_passe) safeBody.mot_de_passe = '***';
            console.log('Body:', safeBody);
        }
    }
    next();
});

// Servir les fichiers statiques du frontend
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Dossier pour les uploads d'images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================================
// ROUTES API
// ============================================================
const authRoutes       = require('./routes/auth');
const produitsRoutes   = require('./routes/produits');
const vendeursRoutes   = require('./routes/vendeurs');
const commandesRoutes  = require('./routes/commandes');
const categoriesRoutes = require('./routes/categories');
const avisRoutes       = require('./routes/avis');
const uploadRoutes     = require('./routes/upload');
const livraisonRoutes  = require('./routes/livraison');
const supportRoutes    = require('./routes/support');

app.use('/api/auth',       authRoutes);
app.use('/api/produits',   produitsRoutes);
app.use('/api/vendeurs',   vendeursRoutes);
app.use('/api/commandes',  commandesRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/avis',       avisRoutes);
app.use('/api/upload',     uploadRoutes);
app.use('/api/livraison',  livraisonRoutes);
app.use('/api/support',    supportRoutes);

// ============================================================
// ROUTES DE SANTÉ ET DEBUG (Health Check)
// ============================================================
app.get('/api/health', (req, res) => {
    res.json({
        statut: 'ok',
        message: '🌺 Beautiful Women API est en ligne',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/debug-status', async (req, res) => {
    let dbStatus = 'ok';
    let dbError = null;
    try {
        const db = require('./config/db');
        const conn = await db.getConnection();
        conn.release();
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
        uptime: process.uptime()
    });
});

// ============================================================
// REDIRIGER TOUTES LES AUTRES ROUTES VERS index.html (SPA)
// ============================================================
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// ============================================================
// GESTION GLOBALE DES ERREURS
// ============================================================
app.use((err, req, res, next) => {
    console.error('❌ Erreur serveur :', err.stack);
    res.status(500).json({
        succes: false,
        message: 'Erreur interne du serveur',
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
// STABILISATION : GESTION DES ERREURS DE PROCESSUS
// ============================================================
process.on('uncaughtException', (err) => {
    console.error('💥 ERREUR NON GÉRÉE (Processus) :', err.message);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ PROMESSE REJETÉE NON GÉRÉE :', reason);
});

module.exports = app;

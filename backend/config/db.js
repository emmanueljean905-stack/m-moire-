// ============================================================
// BEAUTIFUL WOMEN - Configuration MySQL (Stable & Récupérable)
// ============================================================
const mysql = require('mysql2/promise');

// Création du pool de connexions
const pool = mysql.createPool({
    host:     process.env.DB_HOST     || 'localhost',
    port:     process.env.DB_PORT     || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'beautiful_women',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
    enableKeepAlive: true, // Évite les déconnexions pour inactivité
    keepAliveInitialDelay: 10000
});

/** 
 * GESTIONNAIRE DE CONNEXION ROBUSTE
 * Vérifie périodiquement la santé de la connexion
 */
const checkAndPing = async () => {
    try {
        const conn = await pool.getConnection();
        await conn.ping();
        // console.log('[DB] Heartbeat: OK');
        conn.release();
    } catch (err) {
        console.error('❌ ERREUR CRITIQUE BASE DE DONNÉES :', err.message);
        if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ECONNREFUSED') {
            console.warn('⚠️ Tentative de reconnexion automatique...');
            // Le pool gère la reconnexion à la prochaine requête, 
            // mais on loggue l'incident pour diagnostic.
        }
    }
};

// Vérification initiale
checkAndPing().then(() => {
    console.log('✅ BASE DE DONNÉES : Système de surveillance opérationnel');
});

// Heartbeat toutes les 30 secondes pour garder MySQL éveillé
setInterval(checkAndPing, 30000);

module.exports = pool;

// ============================================================
// BEAUTIFUL WOMEN - Configuration MySQL (Ultra-Robuste v3)
// ============================================================
const mysql = require('mysql2/promise');

// ── Création du pool de connexions robuste ────────────────────
//
// POURQUOI LES DÉCONNEXIONS SURVIENNENT ?
// MySQL (sous XAMPP) ferme automatiquement toute connexion inactive
// après `wait_timeout` secondes (souvent 600s = 10 minutes sous XAMPP).
// Sans mécanisme de keep-alive, le pool garde des connexions "mortes"
// et les requêtes suivantes échouent avec PROTOCOL_CONNECTION_LOST.
//
// SOLUTION APPLIQUÉE :
// 1. `enableKeepAlive` + `keepAliveInitialDelay: 0` → TCP keep-alive immédiat
// 2. `connectTimeout` → ne pas bloquer indéfiniment sur une connexion morte
// 3. Heartbeat toutes les 5 minutes → ping actif pour garder les connexions vivantes
//
const pool = mysql.createPool({
    host:     process.env.DB_HOST     || process.env.MYSQLHOST     || '127.0.0.1',
    port:     process.env.DB_PORT     || process.env.MYSQLPORT     || 3306,
    user:     process.env.DB_USER     || process.env.MYSQLUSER     || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
    database: process.env.DB_NAME     || process.env.MYSQLDATABASE     || 'beautiful_women',
    charset:  'utf8mb4',

    // ── Taille du pool ───────────────────────────────────────
    waitForConnections: true,
    connectionLimit:    10,
    maxIdle:            10, // Nombre maximum de connexions inactives dans le pool
    queueLimit:         0,

    // ── Timeout de connexion et inactivité ───────────────────
    connectTimeout: 10000, // 10 secondes max pour se connecter
    idleTimeout:    30000, // Fermer automatiquement les connexions inactives après 30s

    // ── Keep-Alive TCP ──────────────────────────────────────
    enableKeepAlive:        true,
    keepAliveInitialDelay:  0,   // Premier keep-alive envoyé immédiatement
});

// ── CONFIGURATION INDIVIDUELLE DES NOUVELLES CONNEXIONS ──────────
// Cet événement 'connection' est déclenché par le pool de connexions
// à chaque fois qu'une nouvelle connexion physique vers MySQL est initialisée.
// Cela nous permet d'exécuter des configurations initiales sur cette session MySQL spécifique.
pool.on('connection', (conn) => {
    // Configurer wait_timeout à 28800 secondes (8 heures) pour cette session.
    // Cela empêche MySQL de fermer prématurément la connexion si elle reste inactive.
    conn.query('SET SESSION wait_timeout = 28800', (err) => {
        if (err) console.error('[DB] Erreur lors du réglage de wait_timeout sur la nouvelle connexion:', err.message);
    });
    
    // Configurer interactive_timeout à 28800 secondes (8 heures).
    // Concerne les clients interactifs (comme les sessions en ligne de commande ou les connexions persistantes).
    conn.query('SET SESSION interactive_timeout = 28800', (err) => {
        if (err) console.error('[DB] Erreur lors du réglage de interactive_timeout sur la nouvelle connexion:', err.message);
    });
});


// ── HEARTBEAT ACTIF : Maintenir les connexions vivantes ───────
/**
 * Toutes les 5 minutes, on obtient une connexion du pool et on envoie
 * un ping + on force la variable wait_timeout à 8h pour cette session.
 *
 * Pourquoi 5 minutes ? Parce que XAMPP règle souvent wait_timeout à 600s
 * (10 min). En pingant toutes les 5 min, on reste bien en dessous de ce seuil.
 */
const heartbeat = async () => {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.ping();
        // console.log(`[DB] ♥ Heartbeat OK @ ${new Date().toLocaleTimeString()}`);
    } catch (err) {
        console.error(`[DB] ⚠️  Heartbeat échoué (${err.code || err.message}). MySQL est-il lancé dans XAMPP ?`);
        // Le pool créera automatiquement une nouvelle connexion à la prochaine requête
    } finally {
        // Libérer la connexion dans tous les cas → évite les fuites de connexions
        if (conn) conn.release();
    }
};

// Vérification initiale au démarrage
heartbeat()
    .then(() => console.log('✅ [DB] Base de données connectée et opérationnelle.'))
    .catch(() => console.error('❌ [DB] Connexion initiale échouée. Vérifiez que MySQL est lancé dans XAMPP.'));

// Heartbeat toutes les 5 minutes (300 000 ms)
const heartbeatInterval = setInterval(heartbeat, 5 * 60 * 1000);

// Nettoyage propre si le processus Node s'arrête
process.on('SIGTERM', () => clearInterval(heartbeatInterval));
process.on('SIGINT',  () => clearInterval(heartbeatInterval));

// ── Export du pool ────────────────────────────────────────────
module.exports = pool;

// ============================================================
// BEAUTIFUL WOMEN - Configuration MySQL (Ultra-Robuste v4)
// ============================================================
const mysql = require('mysql2/promise');

// ── Lecture de MYSQL_URL (injecte automatiquement par Railway) ──
// Railway fournit une URL complete : mysql://user:pass@host:port/db
const parseMysqlUrl = () => {
    const url = process.env.MYSQL_URL
             || process.env.DATABASE_URL
             || process.env.MYSQL_PRIVATE_URL;
    if (!url || !url.startsWith('mysql')) return null;
    try {
        const u = new URL(url);
        return {
            host:     u.hostname,
            port:     parseInt(u.port) || 3306,
            user:     decodeURIComponent(u.username),
            password: decodeURIComponent(u.password),
            database: u.pathname.replace(/^\//, '')
        };
    } catch (e) {
        console.error('[DB] Erreur parsing MYSQL_URL :', e.message);
        return null;
    }
};

const urlConfig = parseMysqlUrl();

// ── Log de demarrage (aide au diagnostic Railway) ────────────
if (urlConfig) {
    console.log('[DB] Connexion via MYSQL_URL -> ' + urlConfig.host + ':' + urlConfig.port + '/' + urlConfig.database);
} else {
    const h = process.env.DB_HOST || process.env.MYSQLHOST || process.env.MYSQL_HOST || '127.0.0.1';
    const u = process.env.DB_USER || process.env.MYSQLUSER || process.env.MYSQL_USER || 'root';
    const d = process.env.DB_NAME || process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || 'beautiful_women';
    console.log('[DB] Connexion via variables -> host=' + h + ' user=' + u + ' db=' + d);
}

// ── Creation du pool de connexions robuste ────────────────────
const pool = mysql.createPool({
    host:     urlConfig ? urlConfig.host     : (process.env.DB_HOST     || process.env.MYSQLHOST     || process.env.MYSQL_HOST     || '127.0.0.1'),
    port:     urlConfig ? urlConfig.port     : Number(process.env.DB_PORT || process.env.MYSQLPORT || process.env.MYSQL_PORT || 3306),
    user:     urlConfig ? urlConfig.user     : (process.env.DB_USER     || process.env.MYSQLUSER     || process.env.MYSQL_USER     || 'root'),
    password: urlConfig ? urlConfig.password : (process.env.DB_PASSWORD || process.env.MYSQL_ROOT_PASSWORD || process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD || ''),
    database: urlConfig ? urlConfig.database : (process.env.DB_NAME     || process.env.MYSQLDATABASE || process.env.MYSQL_DATABASE || 'beautiful_women'),
    charset:  'utf8mb4',

    // SSL (obligatoire en production Railway)
    ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : undefined,

    // Taille du pool
    waitForConnections: true,
    connectionLimit:    10,
    maxIdle:            10,
    queueLimit:         0,

    // Timeout de connexion et inactivite
    connectTimeout: 10000,
    idleTimeout:    30000,

    // Keep-Alive TCP
    enableKeepAlive:       true,
    keepAliveInitialDelay: 0,
});

// Configuration des nouvelles connexions
pool.on('connection', (conn) => {
    conn.query('SET SESSION wait_timeout = 28800', (err) => {
        if (err) console.error('[DB] Erreur wait_timeout:', err.message);
    });
    conn.query('SET SESSION interactive_timeout = 28800', (err) => {
        if (err) console.error('[DB] Erreur interactive_timeout:', err.message);
    });
});

// HEARTBEAT : Maintenir les connexions vivantes
const heartbeat = async () => {
    let conn;
    try {
        conn = await pool.getConnection();
        await conn.ping();
    } catch (err) {
        console.error('[DB] Heartbeat echoue (' + (err.code || err.message) + ')');
    } finally {
        if (conn) conn.release();
    }
};

// Verification initiale au demarrage
heartbeat()
    .then(() => console.log('OK [DB] Base de donnees connectee.'))
    .catch(() => console.error('ERREUR [DB] Connexion echouee. Verifiez les variables DB sur Railway.'));

// Heartbeat toutes les 5 minutes
const heartbeatInterval = setInterval(heartbeat, 5 * 60 * 1000);

process.on('SIGTERM', () => clearInterval(heartbeatInterval));
process.on('SIGINT',  () => clearInterval(heartbeatInterval));

module.exports = pool;

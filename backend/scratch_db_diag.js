
const pool = require('./config/db');
require('dotenv').config();

async function diagnostic() {
    console.log('--- DIAGNOSTIC BASE DE DONNÉES ---');
    console.log('Hôte:', process.env.DB_HOST || 'localhost');
    console.log('Base:', process.env.DB_NAME || 'beautiful_women');
    
    try {
        const [rows] = await pool.query('SELECT 1 + 1 AS result');
        console.log('✅ Connexion réussie ! (Test simple 1+1)');
        
        const [tables] = await pool.query('SHOW TABLES');
        console.log('Tables trouvées:', tables.length);
        tables.forEach(t => console.log(' - ' + Object.values(t)[0]));
        
        process.exit(0);
    } catch (err) {
        console.error('❌ ÉCHEC DE LA CONNEXION :');
        console.error('Code:', err.code);
        console.error('Message:', err.message);
        process.exit(1);
    }
}

diagnostic();

const pool = require('./config/db');

async function checkProduits() {
    try {
        const [rows] = await pool.query('SELECT id, nom, images FROM produits LIMIT 20');
        console.log('--- Produits ---');
        rows.forEach(p => {
            console.log(`ID: ${p.id} | Nom: ${p.nom} | Images: ${p.images}`);
        });
        process.exit(0);
    } catch (err) {
        console.error('Erreur:', err);
        process.exit(1);
    }
}

checkProduits();

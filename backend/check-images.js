const pool = require('./config/db');

async function checkImages() {
    try {
        const [rows] = await pool.query('SELECT id, nom, images FROM produits');
        console.log('Liste des images dans la base :');
        rows.forEach(r => {
            console.log(`ID: ${r.id} | Nom: ${r.nom} | Images: ${r.images}`);
        });
        process.exit(0);
    } catch (err) {
        console.error('Erreur:', err);
        process.exit(1);
    }
}

checkImages();

const bcrypt = require('bcryptjs');
const pool = require('./config/db');

async function fixPasswords() {
    try {
        const hash = await bcrypt.hash('admin123', 10);
        console.log('Nouveau hash généré (longueur):', hash.length);
        
        await pool.query('UPDATE utilisateurs SET mot_de_passe = ?', [hash]);
        console.log('✅ Tous les utilisateurs mis à jour avec le mot de passe: admin123');
        
        // Vérification
        const [rows] = await pool.query('SELECT email, mot_de_passe FROM utilisateurs LIMIT 1');
        console.log('Vérification hash en base:', rows[0].mot_de_passe);
        
        process.exit(0);
    } catch (err) {
        console.error('Erreur:', err);
        process.exit(1);
    }
}

fixPasswords();

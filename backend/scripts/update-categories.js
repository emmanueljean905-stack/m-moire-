const pool = require('../config/db');

async function updateCategories() {
    try {
        // Déplacer la robe Wax vers la catégorie Wax (1)
        await pool.query('UPDATE produits SET id_categorie = 1 WHERE id = 6');
        
        // Déplacer l'ensemble Bazin vers la catégorie Bazin (2)
        await pool.query('UPDATE produits SET id_categorie = 2 WHERE id = 7');

        console.log("Les modèles cousus ont été replacés dans leurs catégories de tissus respectives !");
        process.exit(0);
    } catch (err) {
        console.error("Erreur:", err);
        process.exit(1);
    }
}

updateCategories();

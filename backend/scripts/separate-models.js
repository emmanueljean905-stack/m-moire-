const pool = require('../config/db');

async function separateModelsFromFabrics() {
    try {
        // IDs of the sewn models
        // 6: Robe Sirène en Wax
        // 7: Ensemble Veste & Pantalon Bazin
        // 31: Robe de Soirée Ankara Moderne
        // 32: Robe de Cérémonie Kente Royal
        // 33: Veste Moderne en Bogolan
        // 34: Parure Royale Kita Traditionnelle
        
        const modelsIds = [6, 7, 31, 32, 33, 34];
        
        // Move all these models to category 7 ("Couture & Modèles")
        const [result] = await pool.query('UPDATE produits SET id_categorie = 7 WHERE id IN (?)', [modelsIds]);
        
        console.log(`✅ ${result.affectedRows} modèles cousus ont été déplacés vers la catégorie "Couture & Modèles" (ID 7).`);
        process.exit(0);
    } catch (err) {
        console.error("Erreur:", err);
        process.exit(1);
    }
}

separateModelsFromFabrics();

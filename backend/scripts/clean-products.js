const pool = require('../config/db');

async function cleanProducts() {
    const idsToKeep = [1, 2, 3, 4, 6, 7, 15];
    console.log("Suppression de tous les produits SAUF les IDs:", idsToKeep);

    try {
        // 1. Delete associated order lines
        await pool.query('DELETE FROM lignes_commande WHERE id_produit NOT IN (?)', [idsToKeep]);
        
        // 2. Delete associated reviews (if column is id_produit)
        try {
            await pool.query('DELETE FROM avis WHERE id_produit NOT IN (?)', [idsToKeep]);
        } catch (e) {
            console.log("Note: Pas de table avis ou colonne id_produit (ignoré)");
        }

        // 3. Delete the products
        const [result] = await pool.query('DELETE FROM produits WHERE id NOT IN (?)', [idsToKeep]);
        console.log(`✅ ${result.affectedRows} produits supprimés avec succès.`);
        
        process.exit(0);
    } catch (err) {
        console.error("Erreur lors de la suppression:", err.message);
        process.exit(1);
    }
}

cleanProducts();

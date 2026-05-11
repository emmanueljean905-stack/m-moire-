const pool = require('../config/db');

async function insertNewProducts() {
    try {
        const query = `
            INSERT INTO produits 
            (nom, description, prix, stock, images, id_categorie, id_vendeur) 
            VALUES ?
        `;

        const values = [
            [
                "Pagne Kita Authentique Tissé Main",
                "Magnifique pagne Kita authentique, tissé à la main selon la tradition, idéal pour vos grandes cérémonies et événements spéciaux.",
                45000,
                10,
                JSON.stringify(["/uploads/pagne_kita.png"]),
                5, // Kita
                1  // Vendeur par défaut
            ],
            [
                "Robe de Soirée Ankara Moderne",
                "Une création sur mesure en véritable tissu Ankara, coupe sirène avec finitions luxueuses, parfaite pour sublimer la silhouette.",
                65000,
                5,
                JSON.stringify(["/uploads/modele_ankara.png"]),
                6, // Ankara
                1
            ]
        ];

        const [result] = await pool.query(query, [values]);
        console.log(`✅ ${result.affectedRows} nouveaux produits africains authentiques ajoutés avec succès !`);
        
        process.exit(0);
    } catch (err) {
        console.error("Erreur lors de l'insertion :", err.message);
        process.exit(1);
    }
}

insertNewProducts();

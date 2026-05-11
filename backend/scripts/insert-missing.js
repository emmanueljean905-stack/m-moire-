const pool = require('../config/db');

async function insertMissingProducts() {
    try {
        const query = `
            INSERT INTO produits 
            (nom, description, prix, stock, images, id_categorie, id_vendeur) 
            VALUES ?
        `;

        const values = [
            [
                "Robe de Cérémonie Kente Royal",
                "Une robe somptueuse conçue avec le plus fin tissu Kente, mariant tradition et haute couture pour vos cérémonies.",
                85000,
                3,
                JSON.stringify(["/uploads/modele_kente.png"]),
                3, // Kente
                1
            ],
            [
                "Veste Moderne en Bogolan",
                "Veste pour homme en authentique tissu Bogolan du Mali. Une coupe moderne pour un style élégant et culturel.",
                45000,
                5,
                JSON.stringify(["/uploads/modele_bogolan.png"]),
                4, // Bogolan
                1
            ],
            [
                "Parure Royale Kita Traditionnelle",
                "Tenue complète de la royauté Akan en Kita prestigieux, accompagnée de ses ornements. Un chef-d'œuvre culturel.",
                120000,
                2,
                JSON.stringify(["/uploads/modele_kita.png"]),
                5, // Kita
                1
            ],
            [
                "Pagne Ankara Imprimé Floral",
                "Véritable tissu Ankara aux motifs floraux vibrants. Idéal pour vos créations de mode contemporaine.",
                25000,
                15,
                JSON.stringify(["/uploads/tissu_ankara.png"]),
                6, // Ankara
                1
            ]
        ];

        const [result] = await pool.query(query, [values]);
        console.log(`✅ ${result.affectedRows} nouveaux produits ajoutés pour compléter les catégories !`);
        
        process.exit(0);
    } catch (err) {
        console.error("Erreur lors de l'insertion :", err.message);
        process.exit(1);
    }
}

insertMissingProducts();

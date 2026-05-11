const mysql = require('mysql2/promise');
require('dotenv').config();

async function addCat() {
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        await connection.execute("INSERT INTO categories (nom, slug, icone) VALUES ('Couture & Modèles', 'couture-modeles', '👗')");
        console.log("✅ Catégorie 'Couture & Modèles' ajoutée.");
    } catch (err) {
        console.error("❌ Erreur :", err.message);
    } finally {
        if (connection) await connection.end();
    }
}
addCat();

/**
 * BEAUTIFUL WOMEN - Vérification de la Base de Données
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
    console.log("🔍 Vérification de la connexion base de données...");
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });
        console.log("✅ Connexion réussie !");
        
        const [users] = await connection.execute('SELECT COUNT(*) as count FROM utilisateurs');
        console.log(`📊 Nombre d'utilisateurs : ${users[0].count}`);
        
        const [prods] = await connection.execute('SELECT COUNT(*) as count FROM produits');
        console.log(`🛍️ Nombre de produits : ${prods[0].count}`);
        
        await connection.end();
        console.log("\n✨ Tout semble prêt pour votre démo !");
    } catch (err) {
        console.error("\n❌ ERREUR :");
        if (err.code === 'ECONNREFUSED') {
            console.error("Vérifiez que MySQL est bien lancé dans XAMPP.");
        } else {
            console.error(err.message);
        }
    }
}

check();

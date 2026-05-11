/**
 * BEAUTIFUL WOMEN - Script d'importation automatique de la base de données
 */
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function autoImport() {
    console.log("\n🐘 TENTATIVE D'IMPORTATION DE LA BASE DE DONNÉES...");
    
    let connection;
    try {
        // 1. Se connecter sans spécifier de DB
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            port: process.env.DB_PORT || 3306,
            multipleStatements: true // Crucial pour importer le SQL
        });

        // 2. Créer la DB si elle n'existe pas
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log(`✅ Base de données "${process.env.DB_NAME}" vérifiée/créée.`);

        await connection.query(`USE ${process.env.DB_NAME}`);

        // 3. Charger le fichier SQL
        const sqlPath = path.join(__dirname, '..', '..', 'database', 'beautiful_women.sql');
        if (!fs.existsSync(sqlPath)) {
            console.error("❌ Erreur : Fichier SQL introuvable dans /database/beautiful_women.sql");
            return;
        }

        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        // 4. Exécuter l'import
        console.log("⏳ Importation des tables et données de base...");
        await connection.query(sql);
        console.log("✅ Importation réussie !");

    } catch (err) {
        console.error("❌ Échec de l'auto-importation :");
        console.error(err.message);
    } finally {
        if (connection) await connection.end();
        console.log("------------------------------------------\n");
    }
}

autoImport();

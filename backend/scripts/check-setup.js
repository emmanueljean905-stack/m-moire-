/**
 * BEAUTIFUL WOMEN - Script de Diagnostic et Préparation
 * Lancez ce script avant la soutenance pour vérifier que tout est OK.
 */
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function checkSetup() {
    console.log("\n🔍 DÉBUT DU DIAGNOSTIC BEAUTIFUL WOMEN...");
    console.log("------------------------------------------");

    let errors = 0;

    // 1. Vérification des variables d'environnement
    console.log("1. Variables d'environnement...");
    if (!process.env.DB_NAME) {
        console.error("❌ ERREUR : Fichier .env manquant ou vide dans le dossier backend.");
        errors++;
    } else {
        console.log("✅ Fichier .env chargé (DB: " + process.env.DB_NAME + ")");
    }

    // 2. Vérification de MySQL
    console.log("\n2. Connexion MySQL...");
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            port: process.env.DB_PORT || 3306
        });
        console.log("✅ Serveur MySQL accessible.");

        // 3. Vérification de la base de données
        try {
            await connection.query(`USE ${process.env.DB_NAME}`);
            console.log(`✅ Base de données "${process.env.DB_NAME}" trouvée.`);

            // 4. Vérification des tables
            const [tables] = await connection.query("SHOW TABLES");
            const tableNames = tables.map(t => Object.values(t)[0]);
            const requiredTables = ['utilisateurs', 'produits', 'commandes', 'lignes_commande', 'categories'];
            
            for (const table of requiredTables) {
                if (tableNames.includes(table)) {
                    console.log(`✅ Table "${table}" présente.`);
                } else {
                    console.error(`❌ ERREUR : Table "${table}" manquante.`);
                    errors++;
                }
            }
        } catch (dbErr) {
            console.error(`❌ ERREUR : La base de données "${process.env.DB_NAME}" n'existe pas.`);
            console.log("👉 Conseil : Importez le fichier SQL dans phpMyAdmin.");
            errors++;
        }
        await connection.end();
    } catch (err) {
        console.error("❌ ERREUR : Impossible de se connecter à MySQL.");
        console.log("👉 Conseil : Vérifiez que XAMPP est lancé et que MySQL est actif (Vert).");
        errors++;
    }

    // 5. Vérification des dossiers
    console.log("\n3. Dossiers et fichiers...");
    const uploadsPath = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadsPath)) {
        console.log("⚠️ Dossier 'uploads' manquant. Création en cours...");
        fs.mkdirSync(uploadsPath);
        console.log("✅ Dossier 'uploads' créé.");
    } else {
        console.log("✅ Dossier 'uploads' présent.");
    }

    console.log("\n------------------------------------------");
    if (errors === 0) {
        console.log("🎉 TOUT EST PRÊT POUR LA SOUTENANCE !");
        console.log("🚀 Lancez le serveur avec : npm run demo");
    } else {
        console.warn(`⚠️  RESTE ${errors} POINT(S) À RÉGLER AVANT LA PRÉSENTATION.`);
    }
    console.log("------------------------------------------\n");
}

checkSetup();

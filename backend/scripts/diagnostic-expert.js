/**
 * BEAUTIFUL WOMEN - Outil de Diagnostic Expert
 * Ce script vérifie point par point pourquoi la connexion échoue.
 */
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function diagnostiquer() {
    console.log("\n--- 🔍 DIAGNOSTIC DE CONNEXION BEAUTIFUL WOMEN ---");
    console.log(`Date : ${new Date().toLocaleString()}`);
    console.log("--------------------------------------------------\n");

    let step = 1;

    try {
        // Étape 1 : Lecture de la config
        console.log(`${step++}. Lecture du fichier .env...`);
        const config = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            db:   process.env.DB_NAME || 'beautiful_women',
            port: process.env.DB_PORT || 3306
        };
        console.log(`   ✅ Config lue : ${config.user}@${config.host}:${config.port}/${config.db}\n`);

        // Étape 2 : Test Connexion MySQL (Service)
        console.log(`${step++}. Test de connexion au service MySQL (XAMPP)...`);
        let connection;
        try {
            connection = await mysql.createConnection({
                host: config.host,
                user: config.user,
                password: process.env.DB_PASSWORD || '',
                port: config.port
            });
            console.log("   ✅ MySQL est bien lancé et accessible !\n");
        } catch (err) {
            console.error("   ❌ ÉCHEC : Impossible de joindre MySQL.");
            if (err.code === 'ECONNREFUSED') {
                console.error("   👉 ACTION : Vérifiez que MySQL est lancé (bouton vert) dans XAMPP.");
            } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
                console.error("   👉 ACTION : Vos identifiants (user/password) sont refusés.");
            }
            return;
        }

        // Étape 3 : Vérification de la Base
        console.log(`${step++}. Vérification de la base de données "${config.db}"...`);
        try {
            await connection.query(`USE ${config.db}`);
            console.log(`   ✅ Base de données "${config.db}" trouvée.\n`);
        } catch (err) {
            if (err.code === 'ER_BAD_DB_ERROR') {
                console.error(`   ❌ ÉCHEC : La base "${config.db}" n'existe pas.`);
                console.error("   👉 ACTION : Vous devez l'importer. Tapez : npm run db:import");
            } else {
                console.error(`   ❌ ERREUR : ${err.message}`);
            }
            await connection.end();
            return;
        }

        // Étape 4 : Scan des Tables (Détection structure)
        console.log(`${step++}. Analyse de la structure des tables...`);
        const [tables] = await connection.query("SHOW TABLES");
        const tableNames = tables.map(t => Object.values(t)[0]);
        console.log(`   📊 Tables trouvées : ${tableNames.join(', ') || 'AUCUNE'}`);

        const tablesAttendues = ['utilisateurs', 'produits', 'vendeurs', 'commandes'];
        const tablesManquantes = tablesAttendues.filter(t => !tableNames.includes(t));
        
        const tablesAnciennes = ['users', 'orders', 'measurements'];
        const hasOldTables = tablesAnciennes.some(t => tableNames.includes(t));

        if (tablesManquantes.length === 0) {
            console.log("   ✅ Structure Beautiful Women : OK\n");
        } else {
            console.warn(`   ⚠️ STRUCTURE PARTIELLE : Il manque les tables [${tablesManquantes.join(', ')}].`);
            if (hasOldTables) {
                console.error("   🚨 ALERTE : Vous avez l'ancienne structure (Afripagne) dans cette base !");
                console.error("   👉 ACTION : Vous devez vider cette base et importer le nouveau SQL.");
            } else {
                console.error("   👉 ACTION : L'importation semble incomplète.");
            }
        }

        // Étape 5 : Test de lecture
        if (tableNames.includes('produits')) {
            const [prods] = await connection.query("SELECT COUNT(*) as count FROM produits");
            console.log(`${step++}. Test de lecture des produits...`);
            console.log(`   ✅ ${prods[0].count} produits prêts à être affichés.\n`);
        }

        await connection.end();
        console.log("--- ✨ DIAGNOSTIC TERMINÉ AVEC SUCCÈS ---");
        console.log("Si tout est au vert, lancez le serveur avec : npm run demo\n");

    } catch (err) {
        console.error(`\n💥 ERREUR FATALE DURANT LE DIAGNOSTIC : ${err.message}`);
    }
}

diagnostiquer();

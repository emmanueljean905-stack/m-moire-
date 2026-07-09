/*
 * Beautiful Women - Script d'initialisation de la base de données pour Railway
 * ============================================================
 * Usage Railway : node scripts/setup-railway-db.js
 * Ce script crée la base, applique le schéma, les migrations et les données de démo.
 */

const mysql = require('mysql2/promise');
const fs    = require('fs');
const path  = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function setupDatabase() {
    console.log('\n🌺 ====================================');
    console.log('   Beautiful Women - Setup Base Railway');
    console.log('   ====================================\n');

    let connection;
    try {
        // Connexion sans spécifier la base (pour pouvoir la créer)
        connection = await mysql.createConnection({
            host:               process.env.DB_HOST     || process.env.MYSQLHOST     || 'localhost',
            port:               parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306'),
            user:               process.env.DB_USER     || process.env.MYSQLUSER     || 'root',
            password:           process.env.DB_PASSWORD || process.env.MYSQL_ROOT_PASSWORD || process.env.MYSQLPASSWORD || '',
            multipleStatements: true,
            ssl:                process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
        });

        const dbName = process.env.DB_NAME || process.env.MYSQLDATABASE || 'beautiful_women';

        // 1. Créer la base de données
        console.log(`📦 Création propre de la base "${dbName}"...`);
        await connection.query(`DROP DATABASE IF EXISTS \`${dbName}\``);
        await connection.query(
            `CREATE DATABASE \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
        );
        await connection.query(`USE \`${dbName}\``);
        console.log('✅ Base de données prête.');

        // 2. Importer le schéma SQL (beautiful_women.sql)
        const sqlPath = path.join(__dirname, '..', '..', 'database', 'beautiful_women.sql');
        if (fs.existsSync(sqlPath)) {
            console.log('📄 Import du schéma SQL...');
            let sql = fs.readFileSync(sqlPath, 'utf8');
            // Supprimer les instructions CREATE DATABASE et USE (déjà fait)
            sql = sql.replace(/CREATE DATABASE.*?;\s*/gi, '');
            sql = sql.replace(/USE\s+\S+;\s*/gi, '');
            await connection.query(sql);
            console.log('✅ Schéma importé.');
        } else {
            console.warn('⚠️  Fichier beautiful_women.sql introuvable. Schéma non importé.');
        }

        // 3. Appliquer les migrations
        console.log('🔄 Application des migrations...');
        try {
            await connection.query(`
                ALTER TABLE vendeurs ADD COLUMN valide TINYINT(1) NOT NULL DEFAULT 1;
            `);
        } catch (err) {
            console.log('ℹ️ Colonne "valide" déjà présente ou non supportée (ignorée).');
        }
        
        try {
            await connection.query(`UPDATE vendeurs SET valide = 1 WHERE valide = 0`);
        } catch (err) {}

        try {
            await connection.query(`
                ALTER TABLE commandes ADD COLUMN methode VARCHAR(50) DEFAULT 'mobile_money';
            `);
        } catch (err) {
            console.log('ℹ️ Colonne "methode" déjà présente ou non supportée (ignorée).');
        }

        // Tables supplémentaires
        await connection.query(`
            CREATE TABLE IF NOT EXISTS litiges (
                id           INT AUTO_INCREMENT PRIMARY KEY,
                description  TEXT NOT NULL,
                statut       ENUM('en_attente', 'resolu') NOT NULL DEFAULT 'en_attente',
                id_commande  INT NOT NULL,
                created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (id_commande) REFERENCES commandes(id) ON DELETE CASCADE
            ) ENGINE=InnoDB
        `);
        await connection.query(`
            CREATE TABLE IF NOT EXISTS favoris (
                id_utilisateur INT NOT NULL,
                id_produit     INT NOT NULL,
                created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id_utilisateur, id_produit),
                FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id) ON DELETE CASCADE,
                FOREIGN KEY (id_produit)     REFERENCES produits(id)     ON DELETE CASCADE
            ) ENGINE=InnoDB
        `);
        console.log('✅ Migrations appliquées.');

        // 4. Données de base (zones de livraison, catégories)
        console.log('🌍 Insertion des zones de livraison...');
        await connection.query(`
            INSERT IGNORE INTO zones_livraison (nom, frais) VALUES
                ('Abidjan - Zone Nord (Cocody, Abobo, Angré)', 2000),
                ('Abidjan - Zone Sud (Marcory, Koumassi, Port-Bouët)', 2000),
                ('Abidjan - Zone Ouest (Yopougon, Songon)', 2500),
                ('Abidjan - Plateau / Adjamé', 1500),
                ('Intérieur - Bouaké', 5000),
                ('Intérieur - San Pedro', 7000),
                ('Intérieur - Yamoussoukro', 4000)
        `);
        await connection.query(`
            INSERT IGNORE INTO categories (nom, slug, icone) VALUES
                ('Wax',     'wax',     '🌸'),
                ('Bazin',   'bazin',   '✨'),
                ('Kente',   'kente',   '👑'),
                ('Bogolan', 'bogolan', '🎨'),
                ('Kita',    'kita',    '🌿'),
                ('Ankara',  'ankara',  '🦋')
        `);
        console.log('✅ Données de base insérées.');

        console.log('\n🎉 =====================================');
        console.log('   Base de données Railway configurée !');
        console.log('   =====================================');
        console.log('\n📝 Compte administrateur :');
        console.log('   Email    : admin@beautifulwomen.ci');
        console.log('   Password : password123');
        console.log('\n📝 Compte vendeur de test :');
        console.log('   Email    : adjoua@gmail.com');
        console.log('   Password : password123\n');

    } catch (err) {
        console.error('\n❌ Erreur lors du setup :', err.message);
        if (err.code === 'ECONNREFUSED') {
            console.error('→ Vérifiez que DB_HOST, DB_PORT, DB_USER, DB_PASSWORD sont corrects dans les variables Railway.\n');
        }
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

setupDatabase();

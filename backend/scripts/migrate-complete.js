// ============================================================
// BEAUTIFUL WOMEN - Script de Migration Automatique
// Rôle : Ajouter les colonnes et tables manquantes à la base
//        de données existante SANS effacer les données.
//
// Usage : node scripts/migrate-complete.js
// ============================================================
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const db = require('../config/db');

async function runMigration() {
    console.log('\n🏁 ==============================');
    console.log('   Migration Beautiful Women v2');
    console.log('   ==============================\n');
    
    let conn;
    try {
        conn = await db.getConnection();

        // ── 1. Colonne 'valide' dans vendeurs ─────────────────────
        console.log('🔄 Vérification de vendeurs.valide...');
        const [colValide] = await conn.query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vendeurs' AND COLUMN_NAME = 'valide'
        `);
        if (colValide.length === 0) {
            await conn.query('ALTER TABLE vendeurs ADD COLUMN valide TINYINT(1) NOT NULL DEFAULT 1 AFTER note_moyenne');
            await conn.query('UPDATE vendeurs SET valide = 1');
            console.log('✅ Colonne vendeurs.valide ajoutée et tous les vendeurs validés.');
        } else {
            console.log('✓  vendeurs.valide existe déjà.');
        }

        // ── 2. Colonne 'methode' dans commandes ───────────────────
        console.log('🔄 Vérification de commandes.methode...');
        const [colMethode] = await conn.query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'commandes' AND COLUMN_NAME = 'methode'
        `);
        if (colMethode.length === 0) {
            await conn.query("ALTER TABLE commandes ADD COLUMN methode VARCHAR(50) DEFAULT 'mobile_money' AFTER frais_livraison");
            console.log('✅ Colonne commandes.methode ajoutée.');
        } else {
            console.log('✓  commandes.methode existe déjà.');
        }

        // ── 3. Table 'litiges' ────────────────────────────────────
        console.log('🔄 Vérification de la table litiges...');
        await conn.query(`
            CREATE TABLE IF NOT EXISTS litiges (
                id           INT AUTO_INCREMENT PRIMARY KEY,
                description  TEXT NOT NULL,
                statut       ENUM('en_attente', 'resolu') NOT NULL DEFAULT 'en_attente',
                id_commande  INT NOT NULL,
                created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (id_commande) REFERENCES commandes(id) ON DELETE CASCADE
            ) ENGINE=InnoDB
        `);
        console.log('✅ Table litiges prête.');

        // ── 4. Table 'favoris' ────────────────────────────────────
        console.log('🔄 Vérification de la table favoris...');
        await conn.query(`
            CREATE TABLE IF NOT EXISTS favoris (
                id_utilisateur INT NOT NULL,
                id_produit     INT NOT NULL,
                created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id_utilisateur, id_produit),
                FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id) ON DELETE CASCADE,
                FOREIGN KEY (id_produit)     REFERENCES produits(id)     ON DELETE CASCADE
            ) ENGINE=InnoDB
        `);
        console.log('✅ Table favoris prête.');

        // ── 5. Zones de livraison ─────────────────────────────────
        console.log('🔄 Vérification des zones de livraison...');
        const [zones] = await conn.query('SELECT COUNT(*) AS n FROM zones_livraison');
        if (zones[0].n === 0) {
            await conn.query(`
                INSERT INTO zones_livraison (nom, frais) VALUES
                    ('Abidjan - Zone Nord (Cocody, Abobo, Angré)', 2000),
                    ('Abidjan - Zone Sud (Marcory, Koumassi, Port-Bouët)', 2000),
                    ('Abidjan - Zone Ouest (Yopougon, Songon)', 2500),
                    ('Abidjan - Plateau / Adjamé', 1500),
                    ('Intérieur - Bouaké', 5000),
                    ('Intérieur - San Pedro', 7000),
                    ('Intérieur - Yamoussoukro', 4000)
            `);
            console.log('✅ Zones de livraison insérées.');
        } else {
            console.log(`✓  ${zones[0].n} zones de livraison déjà présentes.`);
        }

        // ── 6. Catégories ─────────────────────────────────────────
        console.log('🔄 Vérification des catégories...');
        const [cats] = await conn.query('SELECT COUNT(*) AS n FROM categories');
        if (cats[0].n === 0) {
            await conn.query(`
                INSERT INTO categories (nom, slug, icone) VALUES
                    ('Wax',     'wax',     '🌸'),
                    ('Bazin',   'bazin',   '✨'),
                    ('Kente',   'kente',   '👑'),
                    ('Bogolan', 'bogolan', '🎨'),
                    ('Kita',    'kita',    '🌿'),
                    ('Ankara',  'ankara',  '🦋')
            `);
            console.log('✅ Catégories insérées.');
        } else {
            console.log(`✓  ${cats[0].n} catégories déjà présentes.`);
        }

        console.log('\n🎉 ================================');
        console.log('   Migration terminée avec succès !');
        console.log('   ================================\n');
        process.exit(0);

    } catch (err) {
        console.error('\n❌ Erreur de migration :', err.message);
        console.error('   Vérifiez que MySQL est lancé dans XAMPP.\n');
        process.exit(1);
    } finally {
        if (conn) conn.release();
    }
}

runMigration();

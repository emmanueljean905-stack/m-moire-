// ============================================================
// BEAUTIFUL WOMEN - Script de Migration pour l'Administration
// Rôle : Configurer la base de données MySQL pour le support admin.
// ============================================================
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const db = require('../config/db');

async function runMigration() {
    console.log('🏁 Démarrage de la migration de la base de données...');
    let conn;
    try {
        conn = await db.getConnection();

        // 1. Ajouter la colonne 'valide' à la table 'vendeurs' si elle n'existe pas
        console.log('🔄 Vérification de la colonne "valide" dans la table "vendeurs"...');
        const [columns] = await conn.query('SHOW COLUMNS FROM vendeurs LIKE "valide"');
        if (columns.length === 0) {
            console.log('➕ Ajout de la colonne "valide" (TINYINT(1) DEFAULT 0)...');
            await conn.query('ALTER TABLE vendeurs ADD COLUMN valide TINYINT(1) NOT NULL DEFAULT 0');
            console.log('✅ Colonne "valide" ajoutée.');

            // Valider par défaut tous les vendeurs existants pour ne pas bloquer les comptes de test
            console.log('🔓 Activation par défaut des vendeurs existants...');
            await conn.query('UPDATE vendeurs SET valide = 1');
            console.log('✅ Vendeurs existants validés.');
        } else {
            console.log('ℹ️ La colonne "valide" existe déjà dans la table "vendeurs".');
        }

        // 2. Créer la table 'litiges' si elle n'existe pas
        console.log('🔄 Création de la table "litiges" si nécessaire...');
        await conn.query(`
            CREATE TABLE IF NOT EXISTS litiges (
                id INT AUTO_INCREMENT PRIMARY KEY,
                description TEXT NOT NULL,
                statut ENUM('en_attente', 'resolu') NOT NULL DEFAULT 'en_attente',
                id_commande INT NOT NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (id_commande) REFERENCES commandes(id) ON DELETE CASCADE
            ) ENGINE=InnoDB;
        `);
        console.log('✅ Table "litiges" prête.');

        console.log('🎉 Migration terminée avec succès !');
        process.exit(0);
    } catch (err) {
        console.error('❌ Erreur lors de la migration :', err);
        process.exit(1);
    } finally {
        if (conn) conn.release();
    }
}

runMigration();

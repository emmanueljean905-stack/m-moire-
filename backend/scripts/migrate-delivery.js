const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function migrate() {
    const connection = await mysql.createConnection({
        host:     process.env.DB_HOST     || '127.0.0.1',
        port:     process.env.DB_PORT     || 3306,
        user:     process.env.DB_USER     || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME     || 'beautiful_women',
        multipleStatements: true
    });

    console.log('✅ Connexion MySQL établie pour la migration');

    try {
        // 1. Création de la table zones_livraison
        const createZonesTable = `
            CREATE TABLE IF NOT EXISTS zones_livraison (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nom VARCHAR(100) NOT NULL,
                frais DECIMAL(10,0) NOT NULL,
                delai_estime VARCHAR(50)
            ) ENGINE=InnoDB;
        `;
        await connection.query(createZonesTable);
        console.log('--- Table zones_livraison créée ou déjà existante');

        // 2. Insertion des données initiales si vide
        const [rows] = await connection.query('SELECT COUNT(*) as count FROM zones_livraison');
        if (rows[0].count === 0) {
            const insertZones = `
                INSERT INTO zones_livraison (nom, frais) VALUES
                ('Abidjan - Zone 1 (Plateau, Marcory, Treichville, Koumassi)', 1000),
                ('Abidjan - Zone 2 (Cocody, Adjamé, Port-Bouët)', 1500),
                ('Abidjan - Zone 3 (Yopougon, Abobo, Attécoubé)', 2000),
                ('Abidjan Périphérie (Bingerville, Anyama, Songon)', 2500),
                ('Grand-Bassam / Bonoua', 3000),
                ('Intérieur du pays (Bouaké, Yamoussoukro, San-Pedro)', 4500);
            `;
            await connection.query(insertZones);
            console.log('--- Données initiales insérées dans zones_livraison');
        }

        // 3. Mise à jour de la table commandes
        // On vérifie si les colonnes existent déjà
        const [columns] = await connection.query('SHOW COLUMNS FROM commandes');
        const colNames = columns.map(c => c.Field);

        if (!colNames.includes('id_zone_livraison')) {
            await connection.query('ALTER TABLE commandes ADD COLUMN id_zone_livraison INT');
            await connection.query('ALTER TABLE commandes ADD CONSTRAINT fk_livraison FOREIGN KEY (id_zone_livraison) REFERENCES zones_livraison(id)');
            console.log('--- Colonne id_zone_livraison ajoutée à commandes');
        }

        if (!colNames.includes('frais_livraison')) {
            await connection.query('ALTER TABLE commandes ADD COLUMN frais_livraison DECIMAL(10,2) DEFAULT 0');
            console.log('--- Colonne frais_livraison ajoutée à commandes');
        }

        console.log('🚀 Migration terminée avec succès !');

    } catch (err) {
        console.error('❌ Erreur lors de la migration:', err);
    } finally {
        await connection.end();
    }
}

migrate();

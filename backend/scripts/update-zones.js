const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const newZones = [
    { nom: 'Abidjan - Zone 1 (Plateau, Marcory, Treichville, Koumassi)', frais: 1000, delai: '24h' },
    { nom: 'Abidjan - Zone 2 (Cocody, Adjamé, Port-Bouët)', frais: 1500, delai: '24-48h' },
    { nom: 'Abidjan - Zone 3 (Yopougon, Abobo, Attécoubé)', frais: 2000, delai: '48h' },
    { nom: 'Abidjan Périphérie (Bingerville, Anyama, Songon)', frais: 2500, delai: '48-72h' },
    { nom: 'Grand-Bassam / Bonoua', frais: 3000, delai: '48-72h' },
    { nom: 'Intérieur du pays (Bouaké, Yamoussoukro, San-Pedro)', frais: 4500, delai: '3-5 jours' }
];

async function updateZones() {
    console.log('🔄 Mise à jour des zones de livraison...');
    
    let connection;
    try {
        connection = await mysql.createConnection({
            host:     process.env.DB_HOST     || '127.0.0.1',
            user:     process.env.DB_USER     || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME     || 'beautiful_women'
        });

        console.log('✅ Connexion DB réussie');

        // 1. Vider la table
        await connection.query('DELETE FROM zones_livraison');
        await connection.query('ALTER TABLE zones_livraison AUTO_INCREMENT = 1');
        console.log('🗑️  Table zones_livraison réinitialisée');

        // 2. Insérer les nouvelles zones
        for (const zone of newZones) {
            await connection.query(
                'INSERT INTO zones_livraison (nom, frais) VALUES (?, ?)',
                [zone.nom, zone.frais]
            );
            console.log(`➕ Zone ajoutée : ${zone.nom}`);
        }

        console.log('✨ Mise à jour terminée avec succès !');

    } catch (err) {
        console.error('❌ Erreur lors de la mise à jour :', err.message);
    } finally {
        if (connection) await connection.end();
    }
}

updateZones();

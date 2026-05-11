// ============================================================
// BEAUTIFUL WOMEN - Script d'Audit Final (audit-final.js)
// Vérification automatique de l'intégrité du projet
// ============================================================
const db = require('../config/db');

async function audit() {
    console.log('\n🔍 --- DÉBUT DE L\'AUDIT FINAL ---\n');
    let hasErrors = false;

    // 1. Vérification de la connexion DB
    try {
        const [res] = await db.query('SELECT 1');
        console.log('✅ Connexion MySQL : OK');
    } catch (err) {
        console.error('❌ Connexion MySQL : ÉCHEC', err.message);
        return;
    }

    // 2. Vérification des tables critiques
    const tablesAttendues = ['utilisateurs', 'vendeurs', 'produits', 'commandes', 'zones_livraison', 'paiements'];
    for (const table of tablesAttendues) {
        try {
            await db.query(`SELECT 1 FROM ${table} LIMIT 1`);
            console.log(`✅ Table [${table}] : Présente`);
        } catch (err) {
            console.error(`❌ Table [${table}] : MANQUANTE ou erreur de structure !`);
            hasErrors = true;
        }
    }

    // 3. Vérification des colonnes spécifiques (Livraison)
    try {
        const [cols] = await db.query('DESCRIBE commandes');
        const hasZone = cols.some(c => c.Field === 'id_zone_livraison');
        const hasFrais = cols.some(c => c.Field === 'frais_livraison');
        if (hasZone && hasFrais) {
            console.log('✅ Colonnes de livraison (commandes) : OK');
        } else {
            console.error('❌ Colonnes de livraison (commandes) : MANQUANTES !');
            hasErrors = true;
        }
    } catch (err) {
        console.error('❌ Erreur lors de la vérification des colonnes de commandes.');
    }

    // 4. Vérification des données de test
    try {
        const [[countCat]] = await db.query('SELECT COUNT(*) as n FROM categories');
        const [[countZones]] = await db.query('SELECT COUNT(*) as n FROM zones_livraison');
        console.log(`✅ Données : ${countCat.n} catégories, ${countZones.n} zones de livraison.`);
    } catch (err) {
        console.error('❌ Erreur lors de la vérification des données de base.');
    }

    console.log('\n--- RÉSULTAT DE L\'AUDIT ---');
    if (hasErrors) {
        console.log('⚠️  Des problèmes ont été détectés. Veuillez ré-exécuter beautiful_women.sql.');
    } else {
        console.log('✨ Projet validé ! Tout est prêt pour la soutenance. 🚀');
    }
    
    process.exit(hasErrors ? 1 : 0);
}

audit();

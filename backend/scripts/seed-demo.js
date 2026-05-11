/**
 * BEAUTIFUL WOMEN - Script d'Enrichissement des Données (Seed) - Version Authentique 3.0
 * Ce script ajoute des produits premium et authentiques pour les 25-55 ans.
 */
const mysql = require('mysql2/promise');
require('dotenv').config();

const products = [
    // --- WAX (CAT 1) ---
    {
        nom: "Super Wax Hollandais VLISCO - Motif 'Disque'",
        prix: 55000,
        desc: "L'original Vlisco, le prestige du Wax. Un motif intemporel prisé par les femmes élégantes pour les grandes cérémonies.",
        cat: 1,
        vendeur: 1,
        img: '["https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?q=60&w=400"]'
    },
    {
        nom: "Wax Uniwax Côte d'Ivoire - Collection Prestige",
        prix: 18000,
        desc: "Qualité supérieure locale. Des couleurs vibrantes qui ne déteignent pas, idéales pour vos tailleurs et robes de soirée.",
        cat: 1,
        vendeur: 1,
        img: '["https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=60&w=400"]'
    },

    // --- BAZIN (CAT 2) ---
    {
        nom: "Bazin Riche Guezner - Damas Double Éclat",
        prix: 65000,
        desc: "Le Bazin des grandes dames. Son tombé parfait et son éclat soyeux en font le tissu privilégié pour les mariages et baptêmes.",
        cat: 2,
        vendeur: 2,
        img: '["https://images.unsplash.com/photo-1583337130417-3346a1be1de9?q=60&w=400"]'
    },
    {
        nom: "Bazin Teint à la Main - Dégradé Indigo",
        prix: 45000,
        desc: "Artisanat malien authentique. Une teinture profonde et des motifs 'Gagara' pour un style à la fois traditionnel et moderne.",
        cat: 2,
        vendeur: 2,
        img: '["https://images.unsplash.com/photo-1590615370581-265ae19a053b?q=60&w=400"]'
    },

    // --- KENTE (CAT 3) ---
    {
        nom: "Kente Ashanti Original - Tissage 'Fathia Fata Nkrumah'",
        prix: 180000,
        desc: "Tissage main exporté du Ghana. Chaque motif raconte une histoire. Le summum du luxe africain pour les cérémonies de dot.",
        cat: 3,
        vendeur: 1,
        img: '["https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=60&w=400"]'
    },

    // --- BOGOLAN (CAT 4) ---
    {
        nom: "Bogolan Artisanal - Motifs 'Masque' du Mali",
        prix: 35000,
        desc: "Teinture naturelle à base de terre et de plantes. Pièce d'artisanat pure pour confectionner des gilets ou de la décoration chic.",
        cat: 4,
        vendeur: 1,
        img: '["https://images.unsplash.com/photo-1516762689617-e1cffcef479d?q=60&w=400"]'
    },

    // --- KITA (CAT 5) ---
    {
        nom: "Pagne Kita Baoulé - Motif de la Noblesse",
        prix: 50000,
        desc: "Tissage traditionnel ivoirien. Des fils d'or entrelacés pour une tenue royale. Très utilisé pour les mariages coutumiers.",
        cat: 5,
        vendeur: 1,
        img: '["https://images.unsplash.com/photo-1574245831932-d02464731df4?q=60&w=400"]'
    },

    // --- ANKARA (CAT 6) ---
    {
        nom: "Ankara Print Premium - Motifs Géométriques",
        prix: 12000,
        desc: "Un coton doux et respirant avec des imprimés audacieux. Parfait pour les jeunes cadres souhaitant un style 'Afro-Optimiste'.",
        cat: 6,
        vendeur: 2,
        img: '["https://images.unsplash.com/photo-1606041008023-472dfb5e530f?q=60&w=400"]'
    },

    // --- COUTURE & MODÈLES (CAT 7) ---
    {
        nom: "Robe de Gala Sirène - Wax & Dentelle",
        prix: 120000,
        desc: "Une création sur-mesure alliant le Wax VLISCO et la dentelle fine. Idéale pour les réceptions prestigieuses.",
        cat: 7, 
        vendeur: 1,
        img: '["https://images.unsplash.com/photo-1560773021-39ed9846b9a8?q=60&w=400"]'
    },
    {
        nom: "Ensemble Veste Slim & Pantalon Bazin",
        prix: 95000,
        desc: "Coupe italienne moderne retravaillée en Bazin Riche. L'élégance du jeune entrepreneur africain (25-45 ans).",
        cat: 7,
        vendeur: 2,
        img: '["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=60&w=400"]'
    },
    {
        nom: "Tunique Kita Contemporaine - Homme",
        prix: 45000,
        desc: "Col officier avec empiècements en Kita Kita. Un look sobre, chic et affirmé pour le bureau ou les sorties.",
        cat: 7,
        vendeur: 1,
        img: '["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=60&w=400"]'
    }
];

async function seed() {
    console.log("🌱 Enrichissement des données authentiques (Cible 25-55 ans)...");
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        // 1. Récupérer l'ID de la catégorie Couture
        const [catRows] = await connection.execute('SELECT id FROM categories WHERE slug = ?', ['couture-modeles']);
        const coutureCatId = catRows.length > 0 ? catRows[0].id : null;

        if (!coutureCatId) {
            console.error("❌ Catégorie 'couture-modeles' introuvable.");
            return;
        }

        // 2. Ajouter les produits s'ils n'existent pas
        for (const p of products) {
            const catId = p.cat === 7 ? coutureCatId : p.cat;
            const [rows] = await connection.execute('SELECT id FROM produits WHERE nom = ?', [p.nom]);
            if (rows.length === 0) {
                await connection.execute(
                    'INSERT INTO produits (nom, prix, description, id_categorie, id_vendeur, images, stock) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [p.nom, p.prix, p.desc, catId, p.vendeur, p.img, 15]
                );
                console.log(`✅ Produit authentique ajouté : ${p.nom}`);
            }
        }

        console.log("\n✨ Boutique 'Beautiful Women' mise à jour avec du style authentique !");
    } catch (err) {
        console.error("❌ Erreur :", err.message);
    } finally {
        if (connection) await connection.end();
    }
}

seed();

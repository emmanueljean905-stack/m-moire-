// ============================================================
// BEAUTIFUL WOMEN - Routes API Vendeurs
// GET /api/vendeurs              → liste des vendeurs vedettes
// GET /api/vendeurs/:id          → profil vendeur + ses produits
// PUT /api/vendeurs/mon-profil   → modifier son profil (vendeur)
// GET /api/vendeurs/dashboard    → stats du vendeur connecté
// ============================================================
const express = require('express');
const db      = require('../config/db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/vendeurs → vendeurs vedettes (les mieux notés)
router.get('/', async (req, res) => {
    try {
        const [vendeurs] = await db.query(
            `SELECT v.id, v.nom_boutique, v.description, v.localisation,
                    v.logo, v.note_moyenne,
                    COUNT(p.id) AS nb_produits
             FROM vendeurs v
             LEFT JOIN produits p ON p.id_vendeur = v.id AND p.actif = 1
             GROUP BY v.id
             ORDER BY v.note_moyenne DESC, nb_produits DESC
             LIMIT 6`
        );
        res.json({ succes: true, vendeurs });
    } catch (err) {
        console.error('Erreur vendeurs :', err);
        res.status(500).json({ succes: false, message: 'Erreur serveur.' });
    }
});

// GET /api/vendeurs/dashboard → statistiques du vendeur connecté
router.get('/dashboard', authMiddleware, roleMiddleware('vendeur'), async (req, res) => {
    try {
        const [vendeurRows] = await db.query(
            'SELECT id FROM vendeurs WHERE id_utilisateur = ?',
            [req.utilisateur.id]
        );
        if (vendeurRows.length === 0) {
            return res.status(404).json({ succes: false, message: 'Profil vendeur introuvable.' });
        }
        const vendeurId = vendeurRows[0].id;

        // Stats globales
        const [[stats]] = await db.query(
            `SELECT
                (SELECT COUNT(*) FROM produits WHERE id_vendeur = ? AND actif = 1) AS total_produits,
                (SELECT COUNT(*) FROM commandes c
                 JOIN lignes_commande lc ON lc.id_commande = c.id
                 JOIN produits p ON p.id = lc.id_produit
                 WHERE p.id_vendeur = ?) AS total_commandes,
                (SELECT COALESCE(SUM(lc.quantite * lc.prix_unitaire), 0)
                 FROM lignes_commande lc
                 JOIN produits p ON p.id = lc.id_produit
                 JOIN commandes c ON c.id = lc.id_commande
                 WHERE p.id_vendeur = ? AND c.statut = 'livree') AS chiffre_affaires`,
            [vendeurId, vendeurId, vendeurId]
        );

        // Dernières commandes contenant ses produits
        const [commandes] = await db.query(
            `SELECT DISTINCT c.id, c.statut, c.montant_total, c.created_at, c.adresse_liv,
                    c.frais_livraison, z.nom AS zone_nom,
                    u.nom AS acheteur
             FROM commandes c
             JOIN lignes_commande lc ON lc.id_commande = c.id
             JOIN produits p ON p.id = lc.id_produit
             JOIN utilisateurs u ON u.id = c.id_acheteur
             LEFT JOIN zones_livraison z ON z.id = c.id_zone_livraison
             WHERE p.id_vendeur = ?
             ORDER BY c.created_at DESC LIMIT 10`,
            [vendeurId]
        );

        // Produits avec stock faible (≤5)
        const [stockFaible] = await db.query(
            `SELECT id, nom, stock FROM produits
             WHERE id_vendeur = ? AND stock <= 5 AND actif = 1
             ORDER BY stock ASC`,
            [vendeurId]
        );

        res.json({ succes: true, stats, commandes, stockFaible });
    } catch (err) {
        console.error('Erreur dashboard :', err);
        res.status(500).json({ succes: false, message: 'Erreur serveur.' });
    }
});

// GET /api/vendeurs/:id → profil public d'un vendeur
router.get('/:id', async (req, res) => {
    try {
        const [vendeurs] = await db.query(
            `SELECT v.id, v.nom_boutique, v.description, v.localisation,
                    v.logo, v.banniere, v.note_moyenne,
                    u.nom AS nom_proprietaire
             FROM vendeurs v
             JOIN utilisateurs u ON u.id = v.id_utilisateur
             WHERE v.id = ?`,
            [req.params.id]
        );
        if (vendeurs.length === 0) {
            return res.status(404).json({ succes: false, message: 'Vendeur introuvable.' });
        }

        const [produits] = await db.query(
            `SELECT p.id, p.nom, p.prix, p.images, p.note_moyenne, c.nom AS categorie
             FROM produits p
             JOIN categories c ON c.id = p.id_categorie
             WHERE p.id_vendeur = ? AND p.actif = 1
             ORDER BY p.created_at DESC`,
            [req.params.id]
        );

        res.json({ succes: true, vendeur: vendeurs[0], produits });
    } catch (err) {
        console.error('Erreur profil vendeur :', err);
        res.status(500).json({ succes: false, message: 'Erreur serveur.' });
    }
});

// PUT /api/vendeurs/mon-profil → modifier son profil
router.put('/mon-profil', authMiddleware, roleMiddleware('vendeur'), async (req, res) => {
    try {
        const { nom_boutique, description, localisation, logo, banniere } = req.body;
        await db.query(
            `UPDATE vendeurs SET nom_boutique=?, description=?, localisation=?, logo=?, banniere=?
             WHERE id_utilisateur=?`,
            [nom_boutique, description, localisation, logo || null, banniere || null, req.utilisateur.id]
        );
        res.json({ succes: true, message: 'Profil boutique mis à jour.' });
    } catch (err) {
        console.error('Erreur modification vendeur :', err);
        res.status(500).json({ succes: false, message: 'Erreur serveur.' });
    }
});

module.exports = router;

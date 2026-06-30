// ============================================================
// BEAUTIFUL WOMEN - Routes API Administration
// Rôle : Endpoints sécurisés pour la gestion administrative.
// ============================================================
const express = require('express');
const db      = require('../config/db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

// Appliquer les middlewares de sécurité globale pour toutes les routes admin
router.use(authMiddleware);
router.use(roleMiddleware('admin'));

// ----------------------------------------------------------
// ROUTE : Obtenir les statistiques globales (KPIs + commandes récentes)
// URL : GET /api/admin/stats
// ----------------------------------------------------------
router.get('/stats', async (req, res) => {
    try {
        // 1. Chiffre d'affaires global (sur commandes payées, en cours ou livrées)
        const [[caRow]] = await db.query(
            `SELECT COALESCE(SUM(montant_total), 0) AS ca_global 
             FROM commandes 
             WHERE statut IN ('payee', 'en_livraison', 'livree')`
        );

        // 2. Nombre total d'acheteurs
        const [[buyersRow]] = await db.query(
            `SELECT COUNT(*) AS total_acheteurs FROM utilisateurs WHERE role = 'acheteur'`
        );

        // 3. Nombre total de vendeurs
        const [[sellersRow]] = await db.query(
            `SELECT COUNT(*) AS total_vendeurs FROM vendeurs`
        );

        // 4. Nombre total de produits actifs
        const [[productsRow]] = await db.query(
            `SELECT COUNT(*) AS total_produits FROM produits WHERE actif = 1`
        );

        // 5. Les 6 dernières commandes passées sur le site
        const [recentOrders] = await db.query(
            `SELECT c.id, c.montant_total, c.statut, c.created_at, u.nom AS acheteur_nom 
             FROM commandes c
             JOIN utilisateurs u ON u.id = c.id_acheteur
             ORDER BY c.created_at DESC 
             LIMIT 6`
        );

        res.json({
            succes: true,
            stats: {
                chiffre_affaires: caRow.ca_global,
                acheteurs: buyersRow.total_acheteurs,
                vendeurs: sellersRow.total_vendeurs,
                produits: productsRow.total_produits
            },
            commandesRecentes: recentOrders
        });
    } catch (err) {
        console.error('Erreur stats admin :', err);
        res.status(500).json({ succes: false, message: 'Erreur lors de la récupération des statistiques.' });
    }
});

// ----------------------------------------------------------
// ROUTE : Lister tous les vendeurs
// URL : GET /api/admin/vendeurs
// ----------------------------------------------------------
router.get('/vendeurs', async (req, res) => {
    try {
        const [vendeurs] = await db.query(
            `SELECT v.id, v.nom_boutique, v.localisation, v.note_moyenne, v.valide, v.created_at,
                    u.nom AS nom_proprietaire, u.email, u.telephone
             FROM vendeurs v
             JOIN utilisateurs u ON u.id = v.id_utilisateur
             ORDER BY v.created_at DESC`
        );
        res.json({ succes: true, vendeurs });
    } catch (err) {
        console.error('Erreur get vendeurs admin :', err);
        res.status(500).json({ succes: false, message: 'Erreur lors du chargement des vendeurs.' });
    }
});

// ----------------------------------------------------------
// ROUTE : Valider ou Suspendre un vendeur
// URL : PUT /api/admin/vendeurs/:id/valider
// ----------------------------------------------------------
router.put('/vendeurs/:id/valider', async (req, res) => {
    try {
        const { valide } = req.body; // 1 ou 0
        if (valide === undefined || ![0, 1].includes(Number(valide))) {
            return res.status(400).json({ succes: false, message: 'Valeur de validation invalide.' });
        }

        await db.query(
            'UPDATE vendeurs SET valide = ? WHERE id = ?',
            [Number(valide), req.params.id]
        );

        res.json({ 
            succes: true, 
            message: Number(valide) === 1 
                ? 'Le vendeur a été validé avec succès !' 
                : 'Le vendeur a été suspendu.' 
        });
    } catch (err) {
        console.error('Erreur validation vendeur :', err);
        res.status(500).json({ succes: false, message: 'Erreur lors de la validation du vendeur.' });
    }
});

// ----------------------------------------------------------
// ROUTE : Lister tous les produits (pour modération)
// URL : GET /api/admin/produits
// ----------------------------------------------------------
router.get('/produits', async (req, res) => {
    try {
        const [produits] = await db.query(
            `SELECT p.id, p.nom, p.prix, p.stock, p.images, p.actif, p.created_at,
                    v.nom_boutique, c.nom AS categorie
             FROM produits p
             JOIN vendeurs v ON v.id = p.id_vendeur
             JOIN categories c ON c.id = p.id_categorie
             ORDER BY p.created_at DESC`
        );
        res.json({ succes: true, produits });
    } catch (err) {
        console.error('Erreur get produits admin :', err);
        res.status(500).json({ succes: false, message: 'Erreur lors du chargement des produits.' });
    }
});

// ----------------------------------------------------------
// ROUTE : Activer ou Désactiver un produit (Modération)
// URL : PUT /api/admin/produits/:id/moderer
// ----------------------------------------------------------
router.put('/produits/:id/moderer', async (req, res) => {
    try {
        const { actif } = req.body; // 1 ou 0
        if (actif === undefined || ![0, 1].includes(Number(actif))) {
            return res.status(400).json({ succes: false, message: 'Valeur d\'activation invalide.' });
        }

        await db.query(
            'UPDATE produits SET actif = ? WHERE id = ?',
            [Number(actif), req.params.id]
        );

        res.json({ 
            succes: true, 
            message: Number(actif) === 1 
                ? 'Produit réactivé dans le catalogue public.' 
                : 'Produit masqué du catalogue public.' 
        });
    } catch (err) {
        console.error('Erreur moderation produit :', err);
        res.status(500).json({ succes: false, message: 'Erreur lors de la modération du produit.' });
    }
});

// ----------------------------------------------------------
// ROUTE : Lister tous les litiges
// URL : GET /api/admin/litiges
// ----------------------------------------------------------
router.get('/litiges', async (req, res) => {
    try {
        const [litiges] = await db.query(
            `SELECT l.id, l.description, l.statut, l.created_at,
                    c.id AS id_commande, c.montant_total,
                    u.nom AS acheteur_nom
             FROM litiges l
             JOIN commandes c ON c.id = l.id_commande
             JOIN utilisateurs u ON u.id = c.id_acheteur
             ORDER BY l.created_at DESC`
        );
        res.json({ succes: true, litiges });
    } catch (err) {
        console.error('Erreur get litiges admin :', err);
        res.status(500).json({ succes: false, message: 'Erreur lors du chargement des litiges.' });
    }
});

// ----------------------------------------------------------
// ROUTE : Résoudre un litige
// URL : PUT /api/admin/litiges/:id/resoudre
// ----------------------------------------------------------
router.put('/litiges/:id/resoudre', async (req, res) => {
    try {
        await db.query(
            "UPDATE litiges SET statut = 'resolu' WHERE id = ?",
            [req.params.id]
        );
        res.json({ succes: true, message: 'Le litige a été marqué comme résolu ! 🏁' });
    } catch (err) {
        console.error('Erreur resolution litige :', err);
        res.status(500).json({ succes: false, message: 'Erreur lors de la résolution du litige.' });
    }
});

module.exports = router;

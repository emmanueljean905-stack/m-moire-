// ============================================================
// BEAUTIFUL WOMEN - Routes API Catégories
// GET /api/categories        → toutes les catégories
// GET /api/categories/:slug  → détail + produits de la catégorie
// ============================================================
const express = require('express');
const db      = require('../config/db');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const [categories] = await db.query(
            `SELECT c.id, c.nom, c.slug, c.icone,
                    COUNT(p.id) AS nb_produits
             FROM categories c
             LEFT JOIN produits p ON p.id_categorie = c.id AND p.actif = 1
             GROUP BY c.id
             ORDER BY c.nom`
        );
        res.json({ succes: true, categories });
    } catch (err) {
        console.error('Erreur catégories :', err);
        res.status(500).json({ succes: false, message: 'Erreur serveur.' });
    }
});

router.get('/:slug', async (req, res) => {
    try {
        const [cats] = await db.query(
            'SELECT * FROM categories WHERE slug = ? OR id = ?',
            [req.params.slug, req.params.slug]
        );
        if (cats.length === 0) {
            return res.status(404).json({ succes: false, message: 'Catégorie introuvable.' });
        }
        const categorie = cats[0];

        const [produits] = await db.query(
            `SELECT p.id, p.nom, p.prix, p.images, p.note_moyenne, v.nom_boutique
             FROM produits p
             JOIN vendeurs v ON v.id = p.id_vendeur
             WHERE p.id_categorie = ? AND p.actif = 1
             ORDER BY p.created_at DESC`,
            [categorie.id]
        );

        res.json({ succes: true, categorie, produits });
    } catch (err) {
        console.error('Erreur catégorie :', err);
        res.status(500).json({ succes: false, message: 'Erreur serveur.' });
    }
});

module.exports = router;

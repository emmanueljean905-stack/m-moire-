// ============================================================
// BEAUTIFUL WOMEN - Routes API Avis
// POST /api/avis          → laisser un avis (acheteur)
// GET  /api/avis/:id_produit → avis d'un produit
// ============================================================
const express = require('express');
const db      = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// POST /api/avis → laisser un avis sur un produit
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { id_produit, note, commentaire } = req.body;

        if (!id_produit || !note || note < 1 || note > 5) {
            return res.status(400).json({ succes: false, message: 'Produit et note (1-5) requis.' });
        }

        await db.query(
            `INSERT INTO avis (note, commentaire, id_produit, id_utilisateur)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE note = ?, commentaire = ?`,
            [note, commentaire || null, id_produit, req.utilisateur.id, note, commentaire || null]
        );

        // Recalculer la note moyenne du produit
        const [[moy]] = await db.query(
            'SELECT AVG(note) AS moyenne FROM avis WHERE id_produit = ?',
            [id_produit]
        );
        await db.query(
            'UPDATE produits SET note_moyenne = ? WHERE id = ?',
            [moy.moyenne, id_produit]
        );

        res.status(201).json({ succes: true, message: 'Votre avis a été enregistré. Merci ! 🌺' });
    } catch (err) {
        console.error('Erreur avis :', err);
        res.status(500).json({ succes: false, message: 'Erreur serveur.' });
    }
});

// GET /api/avis/:id_produit → liste des avis d'un produit
router.get('/:id_produit', async (req, res) => {
    try {
        const [avis] = await db.query(
            `SELECT a.note, a.commentaire, a.created_at,
                    u.nom AS auteur, u.photo AS photo_auteur
             FROM avis a
             JOIN utilisateurs u ON u.id = a.id_utilisateur
             WHERE a.id_produit = ?
             ORDER BY a.created_at DESC`,
            [req.params.id_produit]
        );
        res.json({ succes: true, avis });
    } catch (err) {
        console.error('Erreur liste avis :', err);
        res.status(500).json({ succes: false, message: 'Erreur serveur.' });
    }
});

module.exports = router;

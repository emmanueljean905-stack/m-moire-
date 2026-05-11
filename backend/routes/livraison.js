// ============================================================
// BEAUTIFUL WOMEN - Routes API Livraison
// GET /api/livraison/zones → Liste des zones de livraison
// ============================================================
const express = require('express');
const db      = require('../config/db');

const router = express.Router();

/** GET /api/livraison/zones */
router.get('/zones', async (req, res) => {
    try {
        const [zones] = await db.query('SELECT * FROM zones_livraison ORDER BY frais ASC');
        res.json({ succes: true, zones });
    } catch (err) {
        console.error('Erreur zones livraison :', err);
        res.status(500).json({ succes: false, message: 'Erreur serveur lors de la récupération des zones.' });
    }
});

module.exports = router;

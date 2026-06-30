// ============================================================
// BEAUTIFUL WOMEN - Routes API Livraison
// Rôle : Gérer les aspects liés à l'expédition et à la livraison,
//        notamment en exposant la liste des zones géographiques de
//        distribution et leurs tarifs correspondants.
//        - GET /api/livraison/zones → Obtenir toutes les zones et frais associés.
// ============================================================
const express = require('express');
const db      = require('../config/db');

const router = express.Router();

// ----------------------------------------------------------
// ROUTE : Récupérer toutes les zones de livraison
// URL : GET /api/livraison/zones
// Accès : Public
// Rôle : Sélectionne l'ensemble des zones de livraison enregistrées
//        dans la base de données, classées par coût croissant.
// ----------------------------------------------------------
router.get('/zones', async (req, res) => {
    try {
        const [zones] = await db.query('SELECT * FROM zones_livraison ORDER BY frais ASC');
        res.json({ succes: true, zones });
    } catch (err) {
        console.error('Erreur zones livraison :', err);
        res.status(500).json({ succes: false, message: 'Erreur serveur lors de la récupération des zones de livraison.' });
    }
});

module.exports = router;

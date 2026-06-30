// ============================================================
// BEAUTIFUL WOMEN - Routes API Avis
// Rôle : Gérer les évaluations et les avis déposés par les acheteurs
//        sur les produits du catalogue.
//        - POST /api/avis          → Laisser ou modifier un avis.
//        - GET  /api/avis/:id_produit → Consulter les avis d'un produit.
// ============================================================
const express = require('express');
const db      = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// ----------------------------------------------------------
// ROUTE : Laisser ou mettre à jour un avis sur un produit
// URL : POST /api/avis
// Accès : Privé (Acheteur connecté)
// Rôle : Enregistre une note et un commentaire en base de données.
//        Recalcule automatiquement la note moyenne globale du produit.
// ----------------------------------------------------------
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { id_produit, note, commentaire } = req.body;

        // 1. Validation de la note (doit être un entier ou décimal entre 1 et 5)
        if (!id_produit || !note || note < 1 || note > 5) {
            return res.status(400).json({ succes: false, message: 'Produit et note valide (1-5) requis.' });
        }

        // 2. Insertion de l'avis en base de données
        // L'utilisation de "ON DUPLICATE KEY UPDATE" permet de mettre à jour automatiquement
        // l'avis existant si cet utilisateur (id_utilisateur) a déjà commenté ce produit (id_produit).
        // (Cela nécessite une contrainte d'unicité UNIQUE(id_produit, id_utilisateur) en base).
        await db.query(
            `INSERT INTO avis (note, commentaire, id_produit, id_utilisateur)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE note = ?, commentaire = ?`,
            [note, commentaire || null, id_produit, req.utilisateur.id, note, commentaire || null]
        );

        // 3. Recalcul de la note moyenne globale du produit
        // Récupère la moyenne (AVG) de toutes les notes attribuées à ce produit
        const [[moy]] = await db.query(
            'SELECT AVG(note) AS moyenne FROM avis WHERE id_produit = ?',
            [id_produit]
        );
        
        // Met à jour le champ note_moyenne directement dans la table 'produits'
        await db.query(
            'UPDATE produits SET note_moyenne = ? WHERE id = ?',
            [moy.moyenne, id_produit]
        );

        res.status(201).json({ succes: true, message: 'Votre avis a été enregistré avec succès. Merci ! 🌺' });
    } catch (err) {
        console.error('Erreur avis :', err);
        res.status(500).json({ succes: false, message: 'Erreur lors de l\'enregistrement de l\'avis.' });
    }
});

// ----------------------------------------------------------
// ROUTE : Récupérer tous les avis associés à un produit
// URL : GET /api/avis/:id_produit
// Accès : Public
// Rôle : Récupère la liste des avis d'un produit avec les infos
//        sur l'auteur de chaque avis (nom, photo).
// ----------------------------------------------------------
router.get('/:id_produit', async (req, res) => {
    try {
        // Sélectionne la note, le commentaire et la date de création
        // en joignant la table 'utilisateurs' pour afficher l'identité de l'auteur.
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
        res.status(500).json({ succes: false, message: 'Erreur lors de la récupération des avis.' });
    }
});

module.exports = router;

// ============================================================
// BEAUTIFUL WOMEN - Routes API Catégories
// Rôle : Fournir les informations sur les catégories d'articles
//        (ex: Robes, Tissus, Couture, Accessoires) et lister
//        les produits associés à chacune.
//        - GET /api/categories        → Toutes les catégories avec leur nombre d'articles actifs.
//        - GET /api/categories/:slug  → Détails d'une catégorie et ses produits associés.
// ============================================================
const express = require('express');
const db      = require('../config/db');

const router = express.Router();

// ----------------------------------------------------------
// ROUTE : Récupérer toutes les catégories
// URL : GET /api/categories
// Accès : Public
// Rôle : Retourne la liste des catégories existantes, incluant
//        le nombre de produits actifs (actif = 1) dans chaque catégorie.
// ----------------------------------------------------------
router.get('/', async (req, res) => {
    try {
        // La requête utilise LEFT JOIN et COUNT(p.id) GROUP BY c.id
        // pour calculer dynamiquement le volume d'articles en stock par catégorie.
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
        res.status(500).json({ succes: false, message: 'Erreur lors de la récupération des catégories.' });
    }
});

// ----------------------------------------------------------
// ROUTE : Récupérer le détail d'une catégorie et ses produits
// URL : GET /api/categories/:slug
// Accès : Public
// Rôle : Retourne les informations d'une catégorie ciblée par son slug
//        (ou son identifiant numérique) ainsi que la liste des produits actifs associés.
// ----------------------------------------------------------
router.get('/:slug', async (req, res) => {
    try {
        // 1. Recherche de la catégorie correspondante (par identifiant ou par slug textuel)
        const [cats] = await db.query(
            'SELECT * FROM categories WHERE slug = ? OR id = ?',
            [req.params.slug, req.params.slug]
        );
        
        // Si aucune catégorie n'est trouvée
        if (cats.length === 0) {
            return res.status(404).json({ succes: false, message: 'Catégorie introuvable.' });
        }
        const categorie = cats[0];

        // 2. Sélection de tous les produits actifs appartenant à cette catégorie
        // Jointure avec la table 'vendeurs' pour obtenir le nom de la boutique qui vend l'article.
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
        res.status(500).json({ succes: false, message: 'Erreur lors de la récupération des produits de cette catégorie.' });
    }
});

module.exports = router;

// ============================================================
// BEAUTIFUL WOMEN - Routes API Vendeurs
// Rôle : Gérer les espaces boutiques des artisans vendeurs, leurs
//        profils publics, et le tableau de bord analytique privé.
//        - GET /api/vendeurs              → Lister les vendeurs vedettes les mieux notés.
//        - GET /api/vendeurs/dashboard    → Obtenir les statistiques du vendeur connecté (chiffre d'affaires, stocks, commandes).
//        - GET /api/vendeurs/:id          → Profil public d'un vendeur et ses produits.
//        - PUT /api/vendeurs/mon-profil   → Modifier le profil boutique du vendeur connecté.
// ============================================================
const express = require('express');
const db      = require('../config/db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

// ----------------------------------------------------------
// ROUTE : Obtenir la liste des vendeurs vedettes (les mieux notés)
// URL : GET /api/vendeurs
// Accès : Public
// Rôle : Renvoie les 6 meilleures boutiques triées par note moyenne
//        et volume de produits actifs en vente.
// ----------------------------------------------------------
router.get('/', async (req, res) => {
    try {
        const showAll = req.query.all === '1';
        const limit = showAll ? '' : 'LIMIT 6';

        const [vendeurs] = await db.query(
            `SELECT v.id, v.nom_boutique, v.localisation,
                    v.logo, v.note_moyenne,
                    COUNT(p.id) AS nb_produits
             FROM vendeurs v
             LEFT JOIN produits p ON p.id_vendeur = v.id AND p.actif = 1
             WHERE v.valide = 1
             GROUP BY v.id
             ORDER BY v.note_moyenne DESC, nb_produits DESC
             ${limit}`
        );

        // Cache public 5 minutes (navigateur) + 2 minutes (proxy/CDN)
        res.set('Cache-Control', 'public, max-age=300, s-maxage=120');
        res.json({ succes: true, vendeurs });
    } catch (err) {
        console.error('Erreur vendeurs :', err);
        res.status(500).json({ succes: false, message: 'Erreur lors de la récupération des vendeurs.' });
    }
});

// ----------------------------------------------------------
// ROUTE : Tableau de bord privé du vendeur
// URL : GET /api/vendeurs/dashboard
// Accès : Privé (Vendeurs connectés uniquement)
// Rôle : Récupère les données clés d'activité de la boutique :
//        chiffre d'affaires, volume de produits, carnet de commandes, alertes stocks.
// ----------------------------------------------------------
router.get('/dashboard', authMiddleware, roleMiddleware('vendeur'), async (req, res) => {
    try {
        // 1. Récupération de l'identifiant vendeur associé à l'utilisateur connecté
        const [vendeurRows] = await db.query(
            'SELECT id, valide FROM vendeurs WHERE id_utilisateur = ?',
            [req.utilisateur.id]
        );
        if (vendeurRows.length === 0) {
            return res.status(404).json({ succes: false, message: 'Profil boutique introuvable pour ce compte.' });
        }
        const vendeurId = vendeurRows[0].id;

        // 2. Requête agrégée pour calculer les KPI clés du vendeur
        // - Nombre de produits actifs en rayon.
        // - Nombre total de commandes reçues contenant au moins un de ses produits.
        // - Chiffre d'affaires cumulé sur les commandes livrées avec succès.
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

        // 3. Récupération des 10 dernières commandes contenant un ou plusieurs articles du vendeur
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

        // 4. Alertes de stock faible (Seuil réglé à 5 unités)
        // Permet au vendeur de savoir quels articles doivent être réapprovisionnés.
        const [stockFaible] = await db.query(
            `SELECT id, nom, stock FROM produits
             WHERE id_vendeur = ? AND stock <= 5 AND actif = 1
             ORDER BY stock ASC`,
            [vendeurId]
        );

        res.json({ succes: true, stats, commandes, stockFaible, valide: vendeurRows[0].valide });
    } catch (err) {
        console.error('Erreur dashboard :', err);
        res.status(500).json({ succes: false, message: 'Erreur lors du calcul des statistiques du tableau de bord.' });
    }
});

// ----------------------------------------------------------
// ROUTE : Consulter le profil public d'un vendeur
// URL : GET /api/vendeurs/:id
// Accès : Public
// Rôle : Affiche les informations de contact de l'artisan
//        et la liste complète de ses produits actifs en catalogue.
// ----------------------------------------------------------
router.get('/:id', async (req, res) => {
    try {
        // 1. Récupération des détails de la boutique et de son gérant
        const [vendeurs] = await db.query(
            `SELECT v.id, v.nom_boutique, v.description, v.localisation,
                    v.logo, v.banniere, v.note_moyenne,
                    u.nom AS nom_proprietaire
             FROM vendeurs v
             JOIN utilisateurs u ON u.id = v.id_utilisateur
             WHERE v.id = ? AND v.valide = 1`,
            [req.params.id]
        );
        if (vendeurs.length === 0) {
            return res.status(404).json({ succes: false, message: 'Vendeur introuvable.' });
        }

        // 2. Récupération de tous les produits mis en vente par cette boutique
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
        res.status(500).json({ succes: false, message: 'Erreur lors du chargement de la boutique.' });
    }
});

// ----------------------------------------------------------
// ROUTE : Mettre à jour les informations de boutique
// URL : PUT /api/vendeurs/mon-profil
// Accès : Privé (Vendeurs connectés)
// Rôle : Met à jour la description, le nom de boutique, la localisation
//        ainsi que les images de marque (logo, bannière).
// ----------------------------------------------------------
router.put('/mon-profil', authMiddleware, roleMiddleware('vendeur'), async (req, res) => {
    try {
        const { nom_boutique, description, localisation, logo, banniere } = req.body;
        
        await db.query(
            `UPDATE vendeurs SET nom_boutique=?, description=?, localisation=?, logo=?, banniere=?
             WHERE id_utilisateur=?`,
            [nom_boutique, description, localisation, logo || null, banniere || null, req.utilisateur.id]
        );
        res.json({ succes: true, message: 'Profil de votre boutique mis à jour avec succès ! 🌺' });
    } catch (err) {
        console.error('Erreur modification vendeur :', err);
        res.status(500).json({ succes: false, message: 'Erreur lors de la mise à jour des informations de boutique.' });
    }
});

module.exports = router;

// ============================================================
// BEAUTIFUL WOMEN - Routes API Produits
// Rôle : Gérer le catalogue d'articles de pagnes, vêtements et créations.
//        - GET    /api/produits          → Rechercher et filtrer les produits avec pagination.
//        - GET    /api/produits/tendances → Obtenir les articles tendance de la semaine.
//        - GET    /api/produits/:id      → Fiche produit détaillée avec avis et suggestions.
//        - POST   /api/produits          → Mettre en vente un produit (vendeur).
//        - PUT    /api/produits/:id      → Modifier un produit (propriétaire ou admin).
//        - DELETE /api/produits/:id      → Retirer de la vente (soft delete).
// ============================================================
const express = require('express');
const db      = require('../config/db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

// ----------------------------------------------------------
// ROUTE : Obtenir la liste des produits avec filtres, tri et pagination
// URL : GET /api/produits
// Accès : Public
// Rôle : Construit dynamiquement une requête SQL avec WHERE clauses
//        selon les critères passés en Query Parameters (catégorie, prix, etc.).
// ----------------------------------------------------------
router.get('/', async (req, res) => {
    try {
        const {
            categorie,      // Nom d'usage (slug) ou identifiant de catégorie
            vendeur_id,     // Filtrer les articles d'une boutique particulière
            prix_min,       // Limite inférieure de prix
            prix_max,       // Limite supérieure de prix
            recherche,      // Chaîne de caractères recherchée dans le titre/description
            ids,            // Liste d'identifiants séparés par des virgules (ex: pour le panier)
            tri = 'recent', // Type de tri : recent | prix_asc | prix_desc | populaire
            page = 1,       // Numéro de page courant
            limite = 12     // Quantité de produits renvoyés par page
        } = req.query;

        // Tableaux pour stocker les critères et les paramètres de requête SQL
        let conditions = ['p.actif = 1', 'v.valide = 1']; // Par défaut, on ne montre que les produits actifs des vendeurs validés
        let params = [];

        // Filtre par catégorie (slug ou id)
        if (categorie) {
            conditions.push('(c.slug = ? OR c.id = ?)');
            params.push(categorie, categorie);
        }
        
        // Filtre par vendeur spécifique
        if (vendeur_id) {
            conditions.push('p.id_vendeur = ?');
            params.push(vendeur_id);
        }
        
        // Filtre par prix minimum
        if (prix_min) {
            conditions.push('p.prix >= ?');
            params.push(Number(prix_min));
        }
        
        // Filtre par prix maximum
        if (prix_max) {
            conditions.push('p.prix <= ?');
            params.push(Number(prix_max));
        }
        
        // Recherche textuelle par ressemblance sur le nom ou la description (LIKE SQL)
        if (recherche) {
            conditions.push('(p.nom LIKE ? OR p.description LIKE ?)');
            params.push(`%${recherche}%`, `%${recherche}%`);
        }
        
        // Sélection de plusieurs IDs spécifiques (ex: chargement du panier local client)
        if (ids) {
            const idList = ids.split(',').map(Number).filter(n => !isNaN(n));
            if (idList.length > 0) {
                conditions.push(`p.id IN (${idList.map(() => '?').join(',')})`);
                params.push(...idList);
            }
        }

        // Dictionnaire des tris supportés pour sécuriser et mapper les requêtes
        const ordres = {
            recent:     'p.created_at DESC', // Plus récent au plus ancien
            prix_asc:   'p.prix ASC',        // Moins cher au plus cher
            prix_desc:  'p.prix DESC',       // Plus cher au moins cher
            populaire:  'p.vues DESC'        // Articles les plus consultés
        };
        const ordre = ordres[tri] || 'p.created_at DESC';

        // Calcul du décalage (offset) SQL pour la pagination
        const offset = (Number(page) - 1) * Number(limite);

        // Assemblage final de la clause WHERE
        const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        // Exécution de la requête SQL principale pour récupérer les données de la page courante
        const [produits] = await db.query(
            `SELECT p.id, p.nom, p.prix, p.stock, p.images, p.vues, p.note_moyenne,
                    p.id_categorie, p.created_at, c.nom AS categorie, c.slug AS categorie_slug,
                    v.nom_boutique, v.id AS vendeur_id
             FROM produits p
             JOIN categories c ON c.id = p.id_categorie
             JOIN vendeurs v   ON v.id = p.id_vendeur
             ${whereClause}
             ORDER BY ${ordre}
             LIMIT ? OFFSET ?`,
            [...params, Number(limite), offset]
        );

        // Exécution d'une seconde requête pour calculer le nombre total de lignes correspondant aux critères
        // Essentiel pour calculer le nombre de pages totales côté frontend.
        const [total] = await db.query(
            `SELECT COUNT(*) AS total
             FROM produits p
             JOIN categories c ON c.id = p.id_categorie
             JOIN vendeurs v   ON v.id = p.id_vendeur
             ${whereClause}`,
            params
        );

        // Désactiver le cache pour forcer la mise à jour immédiate
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.json({
            succes: true,
            produits,
            pagination: {
                page: Number(page),
                limite: Number(limite),
                total: total[0].total,
                pages: Math.ceil(total[0].total / Number(limite))
            }
        });

    } catch (err) {
        console.error('Erreur liste produits :', err);
        res.status(500).json({ succes: false, message: 'Erreur lors du chargement des produits.' });
    }
});

// ----------------------------------------------------------
// ROUTE : Récupérer les articles tendances
// URL : GET /api/produits/tendances
// Accès : Public
// Rôle : Renvoie les 8 articles actifs les plus vus au cours des 7 derniers jours.
//        Comporte un plan de repli (fallback) si le catalogue récent est trop restreint.
// ----------------------------------------------------------
router.get('/tendances', async (req, res) => {
    try {
        // Tenter de récupérer les articles les plus vus créés récemment (<= 7 jours)
        const [produits] = await db.query(
            `SELECT p.id, p.nom, p.prix, p.images, p.note_moyenne, p.vues,
                    c.nom AS categorie, v.nom_boutique
             FROM produits p
             JOIN categories c ON c.id = p.id_categorie
             JOIN vendeurs v   ON v.id = p.id_vendeur
             WHERE p.actif = 1 AND v.valide = 1
               AND p.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
             ORDER BY p.vues DESC
             LIMIT 8`
        );

        // Repli (Fallback) : Si la base contient peu d'articles récents (< 4),
        // on retourne simplement les articles les plus vus de tous les temps.
        if (produits.length < 4) {
            const [fallback] = await db.query(
                `SELECT p.id, p.nom, p.prix, p.images, p.note_moyenne, p.vues,
                        c.nom AS categorie, v.nom_boutique
                 FROM produits p
                 JOIN categories c ON c.id = p.id_categorie
                 JOIN vendeurs v   ON v.id = p.id_vendeur
                 WHERE p.actif = 1 AND v.valide = 1
                 ORDER BY p.vues DESC LIMIT 8`
            );
            return res.json({ succes: true, produits: fallback });
        }

        res.json({ succes: true, produits });
    } catch (err) {
        console.error('Erreur tendances :', err);
        res.status(500).json({ succes: false, message: 'Erreur lors du chargement des tendances.' });
    }
});

// ----------------------------------------------------------
// ROUTE : Détail complet d'un produit
// URL : GET /api/produits/:id
// Accès : Public
// Rôle : Incrémente le compteur de vues de l'article, extrait
//        les informations complètes du produit, ses avis clients,
//        et suggère 4 articles aléatoires similaires de même catégorie.
// ----------------------------------------------------------
router.get('/:id', async (req, res) => {
    try {
        // 1. Incrémenter le nombre de vues du produit de manière atomique (+1)
        await db.query('UPDATE produits SET vues = vues + 1 WHERE id = ?', [req.params.id]);

        // 2. Extraire les détails de l'article et du vendeur
        const [produits] = await db.query(
            `SELECT p.*, c.nom AS categorie, c.slug AS categorie_slug,
                    v.nom_boutique, v.localisation, v.description AS desc_boutique,
                    v.logo AS logo_boutique, v.id AS vendeur_id
             FROM produits p
             JOIN categories c ON c.id = p.id_categorie
             JOIN vendeurs v   ON v.id = p.id_vendeur
             WHERE p.id = ? AND p.actif = 1 AND v.valide = 1`,
            [req.params.id]
        );

        if (produits.length === 0) {
            return res.status(404).json({ succes: false, message: 'Produit introuvable ou retiré de la vente.' });
        }

        const produitSelected = produits[0];

        // 3. Récupérer les avis des clients pour cet article
        const [avis] = await db.query(
            `SELECT a.note, a.commentaire, a.created_at,
                    u.nom AS auteur, u.photo AS photo_auteur
             FROM avis a
             JOIN utilisateurs u ON u.id = a.id_utilisateur
             WHERE a.id_produit = ?
             ORDER BY a.created_at DESC`,
            [req.params.id]
        );

        // 4. Sélectionner jusqu'à 4 produits similaires (de la même catégorie, hors produit actuel) de façon aléatoire (RAND())
        const [similaires] = await db.query(
            `SELECT p.id, p.nom, p.prix, p.images, p.note_moyenne
             FROM produits p
             JOIN vendeurs v ON v.id = p.id_vendeur
             WHERE p.id_categorie = ? AND p.id != ? AND p.actif = 1 AND v.valide = 1
             ORDER BY RAND() LIMIT 4`,
            [produitSelected.id_categorie, req.params.id]
        );

        res.json({
            succes: true,
            produit: produitSelected,
            avis,
            similaires
        });

    } catch (err) {
        console.error('Erreur détail produit :', err);
        res.status(500).json({ succes: false, message: 'Erreur lors du chargement des détails du produit.' });
    }
});

// ----------------------------------------------------------
// ROUTE : Ajouter un produit au catalogue
// URL : POST /api/produits
// Accès : Privé (Vendeurs et Administrateurs uniquement)
// Rôle : Enregistre une nouvelle création/pagne dans le catalogue.
// ----------------------------------------------------------
router.post('/', authMiddleware, roleMiddleware('vendeur', 'admin'), async (req, res) => {
    try {
        const { nom, description, prix, stock, images, id_categorie } = req.body;

        // Validation minimale requise
        if (!nom || !prix || !id_categorie) {
            return res.status(400).json({ succes: false, message: 'Nom, prix et catégorie requis.' });
        }

        // Récupérer l'identifiant vendeur (table 'vendeurs') lié à l'utilisateur connecté
        const [vendeurs] = await db.query(
            'SELECT id, valide FROM vendeurs WHERE id_utilisateur = ?',
            [req.utilisateur.id]
        );
        if (vendeurs.length === 0) {
            return res.status(403).json({ succes: false, message: 'Profil vendeur inexistant pour ce compte.' });
        }
        if (vendeurs[0].valide !== 1) {
            return res.status(403).json({ succes: false, message: 'Votre compte vendeur n\'est pas encore validé par l\'administrateur.' });
        }

        // Insertion du produit. La liste d'images est stockée au format JSON textuel en base.
        const [resultat] = await db.query(
            `INSERT INTO produits (nom, description, prix, stock, images, id_vendeur, id_categorie)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [nom, description || null, prix, stock || 0,
             JSON.stringify(images || []), vendeurs[0].id, id_categorie]
        );

        res.status(201).json({
            succes: true,
            message: 'Produit ajouté avec succès au catalogue ! 🌺',
            id: resultat.insertId
        });

    } catch (err) {
        console.error('Erreur création produit :', err);
        res.status(500).json({ succes: false, message: 'Erreur lors de l\'ajout du produit.' });
    }
});

// ----------------------------------------------------------
// ROUTE : Modifier un produit
// URL : PUT /api/produits/:id
// Accès : Privé (Vendeur propriétaire du produit ou Administrateur)
// Rôle : Met à jour les caractéristiques d'un produit existant.
// ----------------------------------------------------------
router.put('/:id', authMiddleware, roleMiddleware('vendeur', 'admin'), async (req, res) => {
    try {
        const { nom, description, prix, stock, images, id_categorie, actif } = req.body;

        // Vérification des droits : s'assurer que le vendeur connecté possède bien ce produit
        const [check] = await db.query(
            `SELECT p.id, v.valide FROM produits p
             JOIN vendeurs v ON v.id = p.id_vendeur
             WHERE p.id = ? AND v.id_utilisateur = ?`,
            [req.params.id, req.utilisateur.id]
        );
        
        // Si l'utilisateur n'est pas le créateur originel et n'est pas administrateur
        if (check.length === 0 && req.utilisateur.role !== 'admin') {
            return res.status(403).json({ succes: false, message: 'Action interdite. Vous n\'êtes pas le propriétaire de cet article.' });
        }

        if (check.length > 0 && check[0].valide !== 1 && req.utilisateur.role !== 'admin') {
            return res.status(403).json({ succes: false, message: 'Votre compte vendeur est suspendu ou en attente de validation.' });
        }

        // Exécution de l'UPDATE SQL
        await db.query(
            `UPDATE produits SET nom=?, description=?, prix=?, stock=?, images=?,
             id_categorie=?, actif=? WHERE id=?`,
            [nom, description, prix, stock, JSON.stringify(images || []),
             id_categorie, actif !== undefined ? actif : 1, req.params.id]
        );

        res.json({ succes: true, message: 'Produit mis à jour avec succès.' });

    } catch (err) {
        console.error('Erreur modification produit :', err);
        res.status(500).json({ succes: false, message: 'Erreur lors de la mise à jour du produit.' });
    }
});

// ----------------------------------------------------------
// ROUTE : Supprimer un produit (Soft Delete)
// URL : DELETE /api/produits/:id
// Accès : Privé (Vendeur propriétaire du produit ou Administrateur)
// Rôle : Désactive l'article (actif = 0) au lieu de l'effacer physiquement,
//        ce qui préserve l'historique des paniers et des commandes clients passées.
// ----------------------------------------------------------
router.delete('/:id', authMiddleware, roleMiddleware('vendeur', 'admin'), async (req, res) => {
    try {
        // Vérification de la propriété du produit
        const [check] = await db.query(
            `SELECT p.id FROM produits p
             JOIN vendeurs v ON v.id = p.id_vendeur
             WHERE p.id = ? AND v.id_utilisateur = ?`,
            [req.params.id, req.utilisateur.id]
        );
        if (check.length === 0 && req.utilisateur.role !== 'admin') {
            return res.status(403).json({ succes: false, message: 'Action interdite. Droits de propriété insuffisants.' });
        }

        // Soft Delete : Simple mise à jour du flag 'actif' à 0
        await db.query('UPDATE produits SET actif = 0 WHERE id = ?', [req.params.id]);

        res.json({ succes: true, message: 'Produit retiré de la vente avec succès.' });
    } catch (err) {
        console.error('Erreur suppression produit :', err);
        res.status(500).json({ succes: false, message: 'Erreur lors du retrait du produit.' });
    }
});

module.exports = router;

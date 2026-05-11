// ============================================================
// BEAUTIFUL WOMEN - Routes API Produits
// GET    /api/produits          → liste avec filtres & pagination
// GET    /api/produits/:id      → détail d'un produit
// POST   /api/produits          → créer (vendeur)
// PUT    /api/produits/:id      → modifier (vendeur propriétaire)
// DELETE /api/produits/:id      → supprimer (vendeur propriétaire)
// ============================================================
const express = require('express');
const db      = require('../config/db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

// ----------------------------------------------------------
// GET /api/produits
// Liste des produits avec filtres, tri et pagination
// ----------------------------------------------------------
router.get('/', async (req, res) => {
    try {
        const {
            categorie,      // slug ou id de catégorie
            vendeur_id,     // id du vendeur
            prix_min,
            prix_max,
            recherche,      // recherche par nom
            ids,            // liste d'ids séparés par des virgules
            tri = 'recent', // recent | prix_asc | prix_desc | populaire
            page = 1,
            limite = 12
        } = req.query;

        // Construction de la requête dynamique
        let conditions = ['p.actif = 1'];
        let params = [];

        if (categorie) {
            conditions.push('(c.slug = ? OR c.id = ?)');
            params.push(categorie, categorie);
        }
        if (vendeur_id) {
            conditions.push('p.id_vendeur = ?');
            params.push(vendeur_id);
        }
        if (prix_min) {
            conditions.push('p.prix >= ?');
            params.push(Number(prix_min));
        }
        if (prix_max) {
            conditions.push('p.prix <= ?');
            params.push(Number(prix_max));
        }
        if (recherche) {
            conditions.push('(p.nom LIKE ? OR p.description LIKE ?)');
            params.push(`%${recherche}%`, `%${recherche}%`);
        }
        if (ids) {
            const idList = ids.split(',').map(Number).filter(n => !isNaN(n));
            if (idList.length > 0) {
                conditions.push(`p.id IN (${idList.map(() => '?').join(',')})`);
                params.push(...idList);
            }
        }

        // Ordre de tri
        const ordres = {
            recent:     'p.created_at DESC',
            prix_asc:   'p.prix ASC',
            prix_desc:  'p.prix DESC',
            populaire:  'p.vues DESC'
        };
        const ordre = ordres[tri] || 'p.created_at DESC';

        // Pagination
        const offset = (Number(page) - 1) * Number(limite);

        const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

        // Requête principale
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

        // Compter le total pour la pagination
        const [total] = await db.query(
            `SELECT COUNT(*) AS total
             FROM produits p
             JOIN categories c ON c.id = p.id_categorie
             JOIN vendeurs v   ON v.id = p.id_vendeur
             ${whereClause}`,
            params
        );

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
        res.status(500).json({ succes: false, message: 'Erreur serveur.' });
    }
});

// ----------------------------------------------------------
// GET /api/produits/tendances
// Les 8 produits les plus vus cette semaine
// ----------------------------------------------------------
router.get('/tendances', async (req, res) => {
    try {
        const [produits] = await db.query(
            `SELECT p.id, p.nom, p.prix, p.images, p.note_moyenne, p.vues,
                    c.nom AS categorie, v.nom_boutique
             FROM produits p
             JOIN categories c ON c.id = p.id_categorie
             JOIN vendeurs v   ON v.id = p.id_vendeur
             WHERE p.actif = 1
               AND p.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
             ORDER BY p.vues DESC
             LIMIT 8`
        );

        // Fallback : si moins de 4 produits récents, prendre les plus populaires
        if (produits.length < 4) {
            const [fallback] = await db.query(
                `SELECT p.id, p.nom, p.prix, p.images, p.note_moyenne, p.vues,
                        c.nom AS categorie, v.nom_boutique
                 FROM produits p
                 JOIN categories c ON c.id = p.id_categorie
                 JOIN vendeurs v   ON v.id = p.id_vendeur
                 WHERE p.actif = 1
                 ORDER BY p.vues DESC LIMIT 8`
            );
            return res.json({ succes: true, produits: fallback });
        }

        res.json({ succes: true, produits });
    } catch (err) {
        console.error('Erreur tendances :', err);
        res.status(500).json({ succes: false, message: 'Erreur serveur.' });
    }
});

// ----------------------------------------------------------
// GET /api/produits/:id
// Détail complet d'un produit + avis
// ----------------------------------------------------------
router.get('/:id', async (req, res) => {
    try {
        // Incrémenter les vues
        await db.query('UPDATE produits SET vues = vues + 1 WHERE id = ?', [req.params.id]);

        const [produits] = await db.query(
            `SELECT p.*, c.nom AS categorie, c.slug AS categorie_slug,
                    v.nom_boutique, v.localisation, v.description AS desc_boutique,
                    v.logo AS logo_boutique, v.id AS vendeur_id
             FROM produits p
             JOIN categories c ON c.id = p.id_categorie
             JOIN vendeurs v   ON v.id = p.id_vendeur
             WHERE p.id = ? AND p.actif = 1`,
            [req.params.id]
        );

        if (produits.length === 0) {
            return res.status(404).json({ succes: false, message: 'Produit introuvable.' });
        }

        // Récupérer les avis
        const [avis] = await db.query(
            `SELECT a.note, a.commentaire, a.created_at,
                    u.nom AS auteur, u.photo AS photo_auteur
             FROM avis a
             JOIN utilisateurs u ON u.id = a.id_utilisateur
             WHERE a.id_produit = ?
             ORDER BY a.created_at DESC`,
            [req.params.id]
        );

        // Produits similaires (même catégorie)
        const [similaires] = await db.query(
            `SELECT p.id, p.nom, p.prix, p.images, p.note_moyenne
             FROM produits p
             WHERE p.id_categorie = ? AND p.id != ? AND p.actif = 1
             ORDER BY RAND() LIMIT 4`,
            [produits[0].id_categorie, req.params.id]
        );

        res.json({
            succes: true,
            produit: produits[0],
            avis,
            similaires
        });

    } catch (err) {
        console.error('Erreur détail produit :', err);
        res.status(500).json({ succes: false, message: 'Erreur serveur.' });
    }
});

// ----------------------------------------------------------
// POST /api/produits
// Créer un produit (vendeur authentifié)
// ----------------------------------------------------------
router.post('/', authMiddleware, roleMiddleware('vendeur', 'admin'), async (req, res) => {
    try {
        const { nom, description, prix, stock, images, id_categorie } = req.body;

        if (!nom || !prix || !id_categorie) {
            return res.status(400).json({ succes: false, message: 'Nom, prix et catégorie requis.' });
        }

        // Récupérer l'id vendeur de l'utilisateur connecté
        const [vendeurs] = await db.query(
            'SELECT id FROM vendeurs WHERE id_utilisateur = ?',
            [req.utilisateur.id]
        );
        if (vendeurs.length === 0) {
            return res.status(403).json({ succes: false, message: 'Profil vendeur introuvable.' });
        }

        const [resultat] = await db.query(
            `INSERT INTO produits (nom, description, prix, stock, images, id_vendeur, id_categorie)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [nom, description || null, prix, stock || 0,
             JSON.stringify(images || []), vendeurs[0].id, id_categorie]
        );

        res.status(201).json({
            succes: true,
            message: 'Produit ajouté avec succès ! 🌺',
            id: resultat.insertId
        });

    } catch (err) {
        console.error('Erreur création produit :', err);
        res.status(500).json({ succes: false, message: 'Erreur serveur.' });
    }
});

// ----------------------------------------------------------
// PUT /api/produits/:id
// Modifier un produit (vendeur propriétaire uniquement)
// ----------------------------------------------------------
router.put('/:id', authMiddleware, roleMiddleware('vendeur', 'admin'), async (req, res) => {
    try {
        const { nom, description, prix, stock, images, id_categorie, actif } = req.body;

        // Vérifier que le produit appartient bien à ce vendeur
        const [check] = await db.query(
            `SELECT p.id FROM produits p
             JOIN vendeurs v ON v.id = p.id_vendeur
             WHERE p.id = ? AND v.id_utilisateur = ?`,
            [req.params.id, req.utilisateur.id]
        );
        if (check.length === 0 && req.utilisateur.role !== 'admin') {
            return res.status(403).json({ succes: false, message: 'Action non autorisée.' });
        }

        await db.query(
            `UPDATE produits SET nom=?, description=?, prix=?, stock=?, images=?,
             id_categorie=?, actif=? WHERE id=?`,
            [nom, description, prix, stock, JSON.stringify(images || []),
             id_categorie, actif !== undefined ? actif : 1, req.params.id]
        );

        res.json({ succes: true, message: 'Produit mis à jour.' });

    } catch (err) {
        console.error('Erreur modification produit :', err);
        res.status(500).json({ succes: false, message: 'Erreur serveur.' });
    }
});

// ----------------------------------------------------------
// DELETE /api/produits/:id
// ----------------------------------------------------------
router.delete('/:id', authMiddleware, roleMiddleware('vendeur', 'admin'), async (req, res) => {
    try {
        const [check] = await db.query(
            `SELECT p.id FROM produits p
             JOIN vendeurs v ON v.id = p.id_vendeur
             WHERE p.id = ? AND v.id_utilisateur = ?`,
            [req.params.id, req.utilisateur.id]
        );
        if (check.length === 0 && req.utilisateur.role !== 'admin') {
            return res.status(403).json({ succes: false, message: 'Action non autorisée.' });
        }

        // Soft delete : on désactive le produit plutôt que de le supprimer
        await db.query('UPDATE produits SET actif = 0 WHERE id = ?', [req.params.id]);

        res.json({ succes: true, message: 'Produit supprimé.' });
    } catch (err) {
        console.error('Erreur suppression produit :', err);
        res.status(500).json({ succes: false, message: 'Erreur serveur.' });
    }
});

module.exports = router;

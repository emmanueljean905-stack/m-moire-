// ============================================================
// BEAUTIFUL WOMEN - Routes API Commandes
// POST /api/commandes          → passer une commande
// GET  /api/commandes/mes-commandes → commandes de l'acheteur
// GET  /api/commandes/:id      → détail commande
// PUT  /api/commandes/:id/statut → changer statut (vendeur/admin)
// ============================================================
const express = require('express');
const db      = require('../config/db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

// POST /api/commandes → Créer une commande depuis le panier
router.post('/', authMiddleware, async (req, res) => {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        const { articles, id_zone_livraison, adresse_liv, notes, methode_paiement } = req.body;
        // articles = [{ id_produit, quantite }, ...]

        if (!articles || articles.length === 0) {
            return res.status(400).json({ succes: false, message: 'Panier vide.' });
        }

        // 1. Récupérer les frais de livraison
        let frais_livraison = 0;
        if (id_zone_livraison) {
            const [[zone]] = await conn.query('SELECT frais FROM zones_livraison WHERE id = ?', [id_zone_livraison]);
            if (zone) {
                frais_livraison = Number(zone.frais);
            }
        }

        // 2. Calculer le total des articles et vérifier les stocks
        let montant_articles = 0;
        const lignes = [];

        for (const article of articles) {
            const [[produit]] = await conn.query(
                'SELECT id, prix, stock, nom FROM produits WHERE id = ? AND actif = 1',
                [article.id_produit]
            );
            if (!produit) {
                await conn.rollback();
                return res.status(400).json({ succes: false, message: `Produit introuvable.` });
            }
            if (produit.stock < article.quantite) {
                await conn.rollback();
                return res.status(400).json({
                    succes: false,
                    message: `Stock insuffisant pour "${produit.nom}" (disponible: ${produit.stock}).`
                });
            }
            montant_articles += produit.prix * article.quantite;
            lignes.push({ ...article, prix_unitaire: produit.prix });
        }

        const montant_total = montant_articles + frais_livraison;

        // 3. Créer la commande
        const [cmdResult] = await conn.query(
            `INSERT INTO commandes (montant_total, adresse_liv, id_zone_livraison, frais_livraison, notes, id_acheteur)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [montant_total, adresse_liv || null, id_zone_livraison || null, frais_livraison, notes || null, req.utilisateur.id]
        );
        const commandeId = cmdResult.insertId;

        // 4. Insérer les lignes de commande et décrémenter les stocks
        for (const ligne of lignes) {
            await conn.query(
                `INSERT INTO lignes_commande (quantite, prix_unitaire, id_commande, id_produit)
                 VALUES (?, ?, ?, ?)`,
                [ligne.quantite, ligne.prix_unitaire, commandeId, ligne.id_produit]
            );
            await conn.query(
                'UPDATE produits SET stock = stock - ? WHERE id = ?',
                [ligne.quantite, ligne.id_produit]
            );
        }

        // Créer l'entrée paiement
        if (methode_paiement) {
            await conn.query(
                `INSERT INTO paiements (montant, methode, id_commande) VALUES (?, ?, ?)`,
                [montant_total, methode_paiement, commandeId]
            );
        }

        // --- INTÉGRATION CINETPAY V2 (MODE DÉMO SÉCURISÉ) ---
        const trans_id = `BW-${commandeId}-${Date.now()}`;
        
        // 1. Vérification si on doit passer en mode démo
        const isDemo = !process.env.CINETPAY_API_KEY || 
                       process.env.CINETPAY_API_KEY.includes('your_') || 
                       process.env.NODE_ENV === 'development';

        if (isDemo) {
            console.log(`\n💎 MODE DÉMO : Simulation de paiement pour commande #${commandeId}`);
            await conn.commit();
            return res.status(201).json({
                succes: true,
                message: 'Simulation : Commande validée pour la présentation.',
                commande_id: commandeId,
                payment_url: `profil.html?demo_success=1&id=${commandeId}`
            });
        }

        // 2. Tentative de paiement réel si config présente
        try {
            const cinetPayData = {
                apikey: process.env.CINETPAY_API_KEY,
                site_id: process.env.CINETPAY_SITE_ID,
                transaction_id: trans_id,
                amount: montant_total,
                currency: 'XOF',
                description: `Commande #${commandeId} sur Beautiful Women`,
                notify_url: `${process.env.BASE_URL}/api/commandes/notification`,
                return_url: `${process.env.BASE_URL}/profil.html`,
                channels: 'ALL',
                customer_name: req.utilisateur.nom,
                customer_email: req.utilisateur.email,
                customer_phone_number: req.utilisateur.telephone || '0000000000',
                customer_address: adresse_liv || 'Abidjan',
                customer_city: 'Abidjan',
                customer_country: 'CI',
                customer_state: 'CI',
                customer_zip_code: '00225'
            };

            const cpResponse = await fetch('https://api-checkout.cinetpay.com/v2/payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cinetPayData)
            });

            const cpResult = await cpResponse.json();

            if (cpResult.code === '201') {
                await conn.commit();
                return res.status(201).json({
                    succes: true,
                    message: 'Commande créée, redirection vers le paiement...',
                    commande_id: commandeId,
                    payment_token: cpResult.data.payment_token,
                    payment_url: cpResult.data.payment_url
                });
            } else {
                throw new Error(cpResult.message || 'Erreur CinetPay');
            }
        } catch (cpErr) {
            console.warn("⚠️ CinetPay indisponible, basculement automatique en simulation démo.");
            await conn.commit();
            return res.status(201).json({
                succes: true,
                message: 'Mode Démo : Redirection vers votre espace client...',
                commande_id: commandeId,
                payment_url: `profil.html?demo_success=1&id=${commandeId}`
            });
        }

    } catch (err) {
        await conn.rollback();
        console.error('Erreur commande :', err);
        res.status(500).json({ succes: false, message: 'Erreur lors de la commande.' });
    } finally {
        conn.release();
    }
});

// GET /api/commandes/mes-commandes
router.get('/mes-commandes', authMiddleware, async (req, res) => {
    try {
        const [commandes] = await db.query(
            `SELECT c.id, c.statut, c.montant_total, c.created_at,
                    COUNT(lc.id) AS nb_articles
             FROM commandes c
             JOIN lignes_commande lc ON lc.id_commande = c.id
             WHERE c.id_acheteur = ?
             GROUP BY c.id
             ORDER BY c.created_at DESC`,
            [req.utilisateur.id]
        );
        res.json({ succes: true, commandes });
    } catch (err) {
        console.error('Erreur mes-commandes :', err);
        res.status(500).json({ succes: false, message: 'Erreur serveur.' });
    }
});

// GET /api/commandes/:id
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const [commandes] = await db.query(
            `SELECT c.*, p.statut AS statut_paiement, p.methode
             FROM commandes c
             LEFT JOIN paiements p ON p.id_commande = c.id
             WHERE c.id = ? AND (c.id_acheteur = ? OR ? = 'admin')`,
            [req.params.id, req.utilisateur.id, req.utilisateur.role]
        );
        if (commandes.length === 0) {
            return res.status(404).json({ succes: false, message: 'Commande introuvable.' });
        }

        const [lignes] = await db.query(
            `SELECT lc.quantite, lc.prix_unitaire,
                    pr.nom, pr.images
             FROM lignes_commande lc
             JOIN produits pr ON pr.id = lc.id_produit
             WHERE lc.id_commande = ?`,
            [req.params.id]
        );

        res.json({ succes: true, commande: commandes[0], lignes });
    } catch (err) {
        console.error('Erreur détail commande :', err);
        res.status(500).json({ succes: false, message: 'Erreur serveur.' });
    }
});

// PUT /api/commandes/:id/statut
// Autorise les vendeurs/admins à tout changer, et les acheteurs à ANNULER leurs propres commandes
router.put('/:id/statut', authMiddleware, async (req, res) => {
    try {
        const { statut } = req.body;
        const orderId = req.params.id;
        const userId = req.utilisateur.id;
        const userRole = req.utilisateur.role;

        const statutsValides = ['en_attente', 'payee', 'en_livraison', 'livree', 'annulee'];
        if (!statutsValides.includes(statut)) {
            return res.status(400).json({ succes: false, message: 'Statut invalide.' });
        }

        // 1. Récupérer la commande pour vérifier la propriété et le statut actuel
        const [commandes] = await db.query('SELECT id_acheteur, statut FROM commandes WHERE id = ?', [orderId]);
        if (commandes.length === 0) {
            return res.status(404).json({ succes: false, message: 'Commande introuvable.' });
        }
        const order = commandes[0];

        // 2. Gestion des permissions
        let autorise = false;
        
        if (userRole === 'vendeur' || userRole === 'admin') {
            autorise = true; // Vendeurs et admins peuvent tout faire
        } else if (order.id_acheteur === userId && statut === 'annulee') {
            // Un acheteur peut annuler SA commande si elle n'est pas encore en livraison/livrée
            if (['en_attente', 'payee'].includes(order.statut)) {
                autorise = true;
            } else {
                return res.status(400).json({ 
                    succes: false, 
                    message: 'Impossible d\'annuler une commande déjà en cours de livraison ou livrée. Veuillez contacter le service client.' 
                });
            }
        }

        if (!autorise) {
            return res.status(403).json({ succes: false, message: 'Non autorisé à modifier ce statut.' });
        }

        // 3. Mise à jour
        await db.query('UPDATE commandes SET statut = ? WHERE id = ?', [statut, orderId]);
        
        res.json({ 
            succes: true, 
            message: statut === 'annulee' ? 'Commande annulée avec succès.' : 'Statut mis à jour.' 
        });
    } catch (err) {
        console.error('Erreur statut commande :', err);
        res.status(500).json({ succes: false, message: 'Erreur serveur.' });
    }
});

// ----------------------------------------------------------
// POST /api/commandes/notification
// Webhook appelé par CinetPay après le paiement
// ----------------------------------------------------------
router.post('/notification', async (req, res) => {
    try {
        const { cpm_site_id, cpm_trans_id } = req.body;

        if (!cpm_trans_id) return res.status(400).send('ID manquant');

        // Vérifier le statut de la transaction auprès de CinetPay
        const checkData = {
            apikey: process.env.CINETPAY_API_KEY,
            site_id: cpm_site_id || process.env.CINETPAY_SITE_ID,
            transaction_id: cpm_trans_id
        };

        const checkRes = await fetch('https://api-checkout.cinetpay.com/v2/payment/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(checkData)
        });

        const result = await checkRes.json();

        if (result.code === '00') {
            // Le paiement est validé !
            // Extraire l'ID de commande depuis cpm_trans_id ("BW-ID-TIMESTAMP")
            const parts = cpm_trans_id.split('-');
            const commandeId = parts[1];

            await db.query('UPDATE commandes SET statut = ? WHERE id = ?', ['payee', commandeId]);
            await db.query('UPDATE paiements SET statut = ? WHERE id_commande = ?', ['succes', commandeId]);
            
            console.log(`✅ Commande #${commandeId} payée avec succès via CinetPay.`);
        }

        res.status(200).send('OK');
    } catch (err) {
        console.error('Erreur notification :', err);
        res.status(500).send('Erreur');
    }
});

module.exports = router;

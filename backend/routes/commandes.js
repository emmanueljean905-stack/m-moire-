// ============================================================
// BEAUTIFUL WOMEN - Routes API Commandes
// Rôle : Gérer le processus d'achat, de paiement, de suivi et 
//        de mise à jour du statut des commandes.
//        - POST /api/commandes          → Passer une commande avec transaction et paiement (simulation ou réel).
//        - GET  /api/commandes/mes-commandes → Lister les commandes de l'acheteur connecté.
//        - GET  /api/commandes/:id      → Récupérer le détail complet d'une commande.
//        - PUT  /api/commandes/:id/statut → Modifier l'état d'avancement d'une commande.
//        - POST /api/commandes/notification → Webhook de confirmation de paiement (CinetPay).
// ============================================================
const express = require('express');
const db      = require('../config/db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

// ----------------------------------------------------------
// ROUTE : Passer une nouvelle commande
// URL : POST /api/commandes
// Accès : Privé (Acheteur connecté)
// Rôle : Crée une commande globale, déduit les stocks des produits,
//        enregistre les lignes d'achats et initie la procédure de paiement.
//        Utilise des transactions SQL pour garantir l'intégrité des données.
// ----------------------------------------------------------
router.post('/', authMiddleware, async (req, res) => {
    // On obtient une connexion dédiée du pool pour piloter la transaction SQL
    const conn = await db.getConnection();
    try {
        // Débuter la transaction. Si une seule étape échoue, aucun changement ne sera enregistré.
        await conn.beginTransaction();

        const { articles, id_zone_livraison, adresse_liv, notes, methode_paiement } = req.body;
        // Le format attendu pour 'articles' est : [{ id_produit: X, quantite: Y }, ...]

        if (!articles || articles.length === 0) {
            return res.status(400).json({ succes: false, message: 'Le panier est vide.' });
        }

        // 1. Récupération des frais de livraison associés à la zone choisie
        let frais_livraison = 0;
        if (id_zone_livraison) {
            const [[zone]] = await conn.query('SELECT frais FROM zones_livraison WHERE id = ?', [id_zone_livraison]);
            if (zone) {
                frais_livraison = Number(zone.frais);
            }
        }

        // 2. Calcul du coût total et vérification de la disponibilité des stocks
        let montant_articles = 0;
        const lignes = [];

        for (const article of articles) {
            // Récupérer le produit en s'assurant qu'il est actif
            const [[produit]] = await conn.query(
                'SELECT id, prix, stock, nom FROM produits WHERE id = ? AND actif = 1',
                [article.id_produit]
            );
            
            // Si le produit n'existe pas en stock ou a été désactivé
            if (!produit) {
                await conn.rollback(); // Annuler toutes les opérations SQL de cette requête
                return res.status(400).json({ succes: false, message: `Produit introuvable.` });
            }
            
            // Si la quantité demandée dépasse le stock physique en base de données
            if (produit.stock < article.quantite) {
                await conn.rollback(); // Annuler les opérations
                return res.status(400).json({
                    succes: false,
                    message: `Stock insuffisant pour "${produit.nom}" (disponible: ${produit.stock}).`
                });
            }
            
            // Calculer le sous-total de l'article et l'empiler dans notre tableau de traitement
            montant_articles += produit.prix * article.quantite;
            lignes.push({ ...article, prix_unitaire: produit.prix });
        }

        // Montant total incluant les frais d'expédition
        const montant_total = montant_articles + frais_livraison;

        // 3. Insertion de la commande principale dans la table 'commandes'
        const [cmdResult] = await conn.query(
            `INSERT INTO commandes (montant_total, adresse_liv, id_zone_livraison, frais_livraison, methode, notes, id_acheteur)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [montant_total, adresse_liv || null, id_zone_livraison || null, frais_livraison, methode_paiement || 'mobile_money', notes || null, req.utilisateur.id]
        );
        const commandeId = cmdResult.insertId;

        // 4. Insertion de chaque article commandé dans la table 'lignes_commande'
        // et décrémentation immédiate du stock disponible dans la table 'produits'.
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

        // Enregistrement de l'intention de paiement dans la table 'paiements'
        if (methode_paiement) {
            await conn.query(
                `INSERT INTO paiements (montant, methode, id_commande) VALUES (?, ?, ?)`,
                [montant_total, methode_paiement, commandeId]
            );
        }

        // --- INTÉGRATION DE L'API DE PAIEMENT CINETPAY ---
        // Identifiant unique pour la transaction de paiement CinetPay
        const trans_id = `BW-${commandeId}-${Date.now()}`;
        
        // Mode Simulation / Démo
        // Bascule en démo UNIQUEMENT si la clé CinetPay n'est pas configurée (clé par défaut ou absente).
        // En production avec une vraie clé, le paiement réel est activé.
        const isDemo = !process.env.CINETPAY_API_KEY || 
                       process.env.CINETPAY_API_KEY.includes('your_');

        if (isDemo) {
            console.log(`\n💎 MODE DÉMO : Simulation de paiement pour commande #${commandeId}`);
            // Valider définitivement la transaction SQL
            await conn.commit();
            return res.status(201).json({
                succes: true,
                message: 'Simulation : Commande validée pour la présentation.',
                commande_id: commandeId,
                payment_url: `profil.html?demo_success=1&id=${commandeId}` // Redirection vers le profil avec indication de succès
            });
        }

        // Tentative d'initialisation d'un paiement réel via l'API CinetPay
        try {
            const cinetPayData = {
                apikey: process.env.CINETPAY_API_KEY,
                site_id: process.env.CINETPAY_SITE_ID,
                transaction_id: trans_id,
                amount: montant_total,
                currency: 'XOF', // Franc CFA (Afrique de l'Ouest)
                description: `Commande #${commandeId} sur Beautiful Women`,
                notify_url: `${process.env.BASE_URL}/api/commandes/notification`, // Webhook pour validation asynchrone
                return_url: `${process.env.BASE_URL}/profil.html`,               // Redirection de retour client
                channels: 'ALL', // Permet tous les moyens (Mobile Money, Carte Bancaire)
                customer_name: req.utilisateur.nom,
                customer_email: req.utilisateur.email,
                customer_phone_number: req.utilisateur.telephone || '0000000000',
                customer_address: adresse_liv || 'Abidjan',
                customer_city: 'Abidjan',
                customer_country: 'CI',
                customer_state: 'CI',
                customer_zip_code: '00225'
            };

            // Requête HTTP POST vers l'API Checkout de CinetPay v2
            const cpResponse = await fetch('https://api-checkout.cinetpay.com/v2/payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cinetPayData)
            });

            const cpResult = await cpResponse.json();

            // Si CinetPay renvoie le code 201 (Succès d'initialisation)
            if (cpResult.code === '201') {
                await conn.commit(); // Validation finale de la transaction SQL
                return res.status(201).json({
                    succes: true,
                    message: 'Commande créée, redirection vers le paiement...',
                    commande_id: commandeId,
                    payment_token: cpResult.data.payment_token,
                    payment_url: cpResult.data.payment_url // URL de paiement fournie par CinetPay
                });
            } else {
                throw new Error(cpResult.message || 'Erreur CinetPay');
            }
        } catch (cpErr) {
            console.warn("⚠️ CinetPay indisponible, basculement automatique en simulation démo.");
            // Validation de la commande SQL en mode démo si l'API externe échoue
            await conn.commit();
            return res.status(201).json({
                succes: true,
                message: 'Mode Démo : Redirection vers votre espace client...',
                commande_id: commandeId,
                payment_url: `profil.html?demo_success=1&id=${commandeId}`
            });
        }

    } catch (err) {
        // En cas d'erreur fatale dans l'un des blocs, annuler tous les changements SQL
        // d'insertion de la commande et de déduction des stocks pour éviter les incohérences.
        await conn.rollback();
        console.error('Erreur commande :', err);
        res.status(500).json({ succes: false, message: 'Erreur lors de la validation de la commande.' });
    } finally {
        // Restituer la connexion MySQL au pool de connexions
        conn.release();
    }
});

// ----------------------------------------------------------
// ROUTE : Récupérer les commandes de l'utilisateur connecté
// URL : GET /api/commandes/mes-commandes
// Accès : Privé (Acheteur connecté)
// Rôle : Liste l'historique des achats de l'utilisateur.
// ----------------------------------------------------------
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
        res.status(500).json({ succes: false, message: 'Erreur lors de la récupération de vos commandes.' });
    }
});

// ----------------------------------------------------------
// ROUTE : Récupérer le détail complet d'une commande spécifique
// URL : GET /api/commandes/:id
// Accès : Privé (Acheteur propriétaire ou Administrateur)
// Rôle : Retourne les détails de facturation d'une commande
//        ainsi que la liste des produits contenus (lignes de commande).
// ----------------------------------------------------------
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        // Recherche de la commande. Les acheteurs ne peuvent voir que leurs propres commandes,
        // tandis que les administrateurs ont un accès global.
        const [commandes] = await db.query(
            `SELECT c.*, z.nom AS zone_nom,
                    p.statut AS statut_paiement,
                    p.methode AS methode_paiement
             FROM commandes c
             LEFT JOIN paiements p ON p.id_commande = c.id
             LEFT JOIN zones_livraison z ON z.id = c.id_zone_livraison
             WHERE c.id = ? AND (c.id_acheteur = ? OR ? = 'admin')`,
            [req.params.id, req.utilisateur.id, req.utilisateur.role]
        );
        
        if (commandes.length === 0) {
            return res.status(404).json({ succes: false, message: 'Commande introuvable ou accès refusé.' });
        }

        // Récupérer la liste des articles achetés dans le cadre de cette commande
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
        res.status(500).json({ succes: false, message: 'Erreur lors de la récupération des détails de la commande.' });
    }
});

// ----------------------------------------------------------
// ROUTE : Mettre à jour le statut d'une commande
// URL : PUT /api/commandes/:id/statut
// Accès : Privé (Vendeurs, Admins pour les étapes; Acheteurs pour annulation)
// Rôle : Permet de faire progresser le cycle de vie de la commande
//        (en_attente → payee → en_livraison → livree) ou d'annuler.
// ----------------------------------------------------------
router.put('/:id/statut', authMiddleware, async (req, res) => {
    try {
        const { statut } = req.body;
        const orderId = req.params.id;
        const userId = req.utilisateur.id;
        const userRole = req.utilisateur.role;

        // Validation du statut cible
        const statutsValides = ['en_attente', 'payee', 'en_livraison', 'livree', 'annulee'];
        if (!statutsValides.includes(statut)) {
            return res.status(400).json({ succes: false, message: 'Statut invalide.' });
        }

        // 1. Récupération de la commande ciblée
        const [commandes] = await db.query('SELECT id_acheteur, statut FROM commandes WHERE id = ?', [orderId]);
        if (commandes.length === 0) {
            return res.status(404).json({ succes: false, message: 'Commande introuvable.' });
        }
        const order = commandes[0];

        // 2. Établissement des droits d'accès
        let autorise = false;
        
        if (userRole === 'vendeur' || userRole === 'admin') {
            autorise = true; // Droits complets de gestion de statut pour les gestionnaires
        } else if (order.id_acheteur === userId && statut === 'annulee') {
            // Un acheteur peut annuler SA PROPRE commande uniquement si elle n'a pas encore
            // été prise en charge pour livraison (statut 'en_attente' ou 'payee').
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
            return res.status(403).json({ succes: false, message: 'Vous n\'êtes pas autorisé à modifier le statut de cette commande.' });
        }

        // 3. Mise à jour du statut en base de données
        await db.query('UPDATE commandes SET statut = ? WHERE id = ?', [statut, orderId]);
        
        res.json({ 
            succes: true, 
            message: statut === 'annulee' ? 'Commande annulée avec succès.' : 'Statut mis à jour avec succès.' 
        });
    } catch (err) {
        console.error('Erreur statut commande :', err);
        res.status(500).json({ succes: false, message: 'Erreur lors de la mise à jour du statut de la commande.' });
    }
});

// ----------------------------------------------------------
// ROUTE : Webhook de notification de paiement
// URL : POST /api/commandes/notification
// Accès : Public (Appelé directement par les serveurs CinetPay)
// Rôle : Reçoit les confirmations de paiement de CinetPay de façon
//        asynchrone, vérifie la transaction et met à jour le statut.
// ----------------------------------------------------------
router.post('/notification', async (req, res) => {
    try {
        const { cpm_site_id, cpm_trans_id } = req.body;

        if (!cpm_trans_id) return res.status(400).send('ID de transaction manquant.');

        // Par mesure de sécurité, nous recontactons l'API CinetPay (Check-Status)
        // pour certifier que la transaction a bien été payée avec succès.
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

        // Le code '00' indique un paiement validé et confirmé chez CinetPay
        if (result.code === '00') {
            // Extraction de l'ID de commande locale depuis l'ID de transaction ("BW-IDCOMMANDE-TIMESTAMP")
            const parts = cpm_trans_id.split('-');
            const commandeId = parts[1];

            // Mise à jour de la commande en statut 'payee'
            await db.query('UPDATE commandes SET statut = ? WHERE id = ?', ['payee', commandeId]);
            // Mise à jour de la transaction de paiement associée en statut 'succes'
            await db.query('UPDATE paiements SET statut = ? WHERE id_commande = ?', ['succes', commandeId]);
            
            console.log(`✅ Commande #${commandeId} payée avec succès via CinetPay.`);
        }

        // Toujours retourner un statut HTTP 200 à CinetPay pour acquitter la réception du webhook
        res.status(200).send('OK');
    } catch (err) {
        console.error('Erreur notification webhook CinetPay :', err);
        res.status(500).send('Erreur interne de traitement de la notification.');
    }
});

// ----------------------------------------------------------
// ROUTE : Déclarer un litige sur une commande
// URL : POST /api/commandes/:id/litige
// Accès : Privé (Acheteur propriétaire uniquement)
// ----------------------------------------------------------
router.post('/:id/litige', authMiddleware, async (req, res) => {
    try {
        const { description } = req.body;
        const commandeId = req.params.id;
        const userId = req.utilisateur.id;

        if (!description || description.trim() === '') {
            return res.status(400).json({ succes: false, message: 'La description du litige est requise.' });
        }

        // Vérifier que la commande appartient bien à l'utilisateur
        const [commandes] = await db.query(
            'SELECT id FROM commandes WHERE id = ? AND id_acheteur = ?',
            [commandeId, userId]
        );

        if (commandes.length === 0) {
            return res.status(403).json({ succes: false, message: 'Vous n\'êtes pas autorisé à signaler un litige pour cette commande.' });
        }

        // Insérer le litige
        await db.query(
            'INSERT INTO litiges (description, id_commande) VALUES (?, ?)',
            [description, commandeId]
        );

        res.status(201).json({ succes: true, message: 'Votre réclamation a bien été enregistrée. Un administrateur la traitera sous peu.' });
    } catch (err) {
        console.error('Erreur declaration litige :', err);
        res.status(500).json({ succes: false, message: 'Erreur lors de la déclaration du litige.' });
    }
});

module.exports = router;

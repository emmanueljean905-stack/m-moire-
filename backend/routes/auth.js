// ============================================================
// BEAUTIFUL WOMEN - Routes d'authentification
// POST /api/auth/inscription
// POST /api/auth/connexion
// GET  /api/auth/profil
// ============================================================
const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const db       = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// ----------------------------------------------------------
// POST /api/auth/inscription
// Créer un nouveau compte (acheteur ou vendeur)
// ----------------------------------------------------------
router.post('/inscription', async (req, res) => {
    try {
        const { nom, email, mot_de_passe, role, telephone, nom_boutique, localisation } = req.body;

        // Validation de base
        if (!nom || !email || !mot_de_passe) {
            return res.status(400).json({ succes: false, message: 'Nom, email et mot de passe requis.' });
        }
        if (!['acheteur', 'vendeur'].includes(role)) {
            return res.status(400).json({ succes: false, message: 'Rôle invalide.' });
        }
        if (role === 'vendeur' && !nom_boutique) {
            return res.status(400).json({ succes: false, message: 'Nom de boutique requis pour les vendeurs.' });
        }

        // Vérifier si l'email existe déjà
        const [existants] = await db.query('SELECT id FROM utilisateurs WHERE email = ?', [email]);
        if (existants.length > 0) {
            return res.status(409).json({ succes: false, message: 'Cet email est déjà utilisé.' });
        }

        // Hasher le mot de passe
        const hash = await bcrypt.hash(mot_de_passe, 10);

        // Insérer l'utilisateur
        const [resultat] = await db.query(
            'INSERT INTO utilisateurs (nom, email, mot_de_passe, role, telephone) VALUES (?, ?, ?, ?, ?)',
            [nom, email, hash, role, telephone || null]
        );
        const idUtilisateur = resultat.insertId;

        let vendeur_id = null;
        // Si c'est un vendeur, créer aussi l'entrée dans la table vendeurs
        if (role === 'vendeur') {
            const [resVendeur] = await db.query(
                'INSERT INTO vendeurs (nom_boutique, localisation, id_utilisateur) VALUES (?, ?, ?)',
                [nom_boutique, localisation || null, idUtilisateur]
            );
            vendeur_id = resVendeur.insertId;
        }

        // Générer le token JWT
        const token = jwt.sign(
            { id: idUtilisateur, nom, email, role },
            process.env.JWT_SECRET || 'beautiful_women_secret',
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.status(201).json({
            succes: true,
            message: `Bienvenue sur Beautiful Women, ${nom} ! 🌺`,
            token,
            utilisateur: { id: idUtilisateur, nom, email, role, vendeur_id }
        });

    } catch (err) {
        console.error('❌ Erreur inscription backend :', err);
        res.status(500).json({ succes: false, message: 'Erreur lors de l\'inscription.', erreur: err.message });
    }
});

// ----------------------------------------------------------
// POST /api/auth/connexion
// ----------------------------------------------------------
router.post('/connexion', async (req, res) => {
    try {
        const { email, mot_de_passe } = req.body;

        if (!email || !mot_de_passe) {
            return res.status(400).json({ succes: false, message: 'Email et mot de passe requis.' });
        }

        // Chercher l'utilisateur
        const [utilisateurs] = await db.query(
            'SELECT * FROM utilisateurs WHERE email = ? AND actif = 1',
            [email]
        );
        if (utilisateurs.length === 0) {
            return res.status(401).json({ succes: false, message: 'Email ou mot de passe incorrect.' });
        }

        const utilisateur = utilisateurs[0];

        // Vérifier le mot de passe
        const correspondance = await bcrypt.compare(mot_de_passe, utilisateur.mot_de_passe);
        if (!correspondance) {
            return res.status(401).json({ succes: false, message: 'Email ou mot de passe incorrect.' });
        }

        // Générer le token
        const token = jwt.sign(
            { id: utilisateur.id, nom: utilisateur.nom, email: utilisateur.email, role: utilisateur.role },
            process.env.JWT_SECRET || 'beautiful_women_secret',
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
            succes: true,
            message: `Bon retour, ${utilisateur.nom} ! 🌺`,
            token,
            utilisateur: {
                id: utilisateur.id,
                nom: utilisateur.nom,
                email: utilisateur.email,
                role: utilisateur.role,
                photo: utilisateur.photo
            }
        });

    } catch (err) {
        console.error('❌ Erreur connexion backend :', err);
        res.status(500).json({ succes: false, message: 'Erreur lors de la connexion.', erreur: err.message });
    }
});

// ----------------------------------------------------------
// PUT /api/auth/profil
// Mettre à jour les infos de l'utilisateur connecté
// ----------------------------------------------------------
router.put('/profil', authMiddleware, async (req, res) => {
    try {
        const { nom, telephone, photo } = req.body;
        const id = req.utilisateur.id;

        // On construit la requête dynamiquement selon ce qui est envoyé
        let updates = [];
        let params = [];

        if (nom) {
            updates.push('nom = ?');
            params.push(nom);
        }
        if (telephone !== undefined) {
            updates.push('telephone = ?');
            params.push(telephone);
        }
        if (photo) {
            updates.push('photo = ?');
            params.push(photo);
        }

        if (updates.length === 0) {
            return res.status(400).json({ succes: false, message: 'Aucun champ à modifier.' });
        }

        params.push(id);
        await db.query(`UPDATE utilisateurs SET ${updates.join(', ')} WHERE id = ?`, params);

        res.json({ succes: true, message: 'Profil mis à jour !' });

    } catch (err) {
        console.error('Erreur mise à jour profil :', err);
        res.status(500).json({ succes: false, message: 'Erreur lors de la mise à jour.' });
    }
});

module.exports = router;

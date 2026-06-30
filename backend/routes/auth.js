// ============================================================
// BEAUTIFUL WOMEN - Routes d'authentification
// Rôle : Gérer les opérations liées aux comptes utilisateurs.
//        - POST /api/auth/inscription : Création d'un compte acheteur ou vendeur.
//        - POST /api/auth/connexion : Connexion de l'utilisateur et génération de token.
//        - PUT  /api/auth/profil : Mise à jour des informations de profil.
// ============================================================
const express  = require('express');
const bcrypt   = require('bcryptjs');   // Bibliothèque pour le hachage sécurisé des mots de passe
const jwt      = require('jsonwebtoken');  // Bibliothèque pour la génération de jetons d'accès signés
const db       = require('../config/db');  // Instance du pool de connexion MySQL
const { authMiddleware } = require('../middleware/auth'); // Middleware de sécurité des routes

const router = express.Router();

// ----------------------------------------------------------
// ROUTE : Inscription d'un nouvel utilisateur
// URL : POST /api/auth/inscription
// Accès : Public
// Rôle : Valide les entrées utilisateur, hache le mot de passe,
//        enregistre l'utilisateur (et la boutique s'il est vendeur),
//        et génère un jeton JWT de session.
// ----------------------------------------------------------
router.post('/inscription', async (req, res) => {
    try {
        // Extraction des données du corps de la requête (req.body)
        const { nom, email, mot_de_passe, role, telephone, nom_boutique, localisation } = req.body;

        // 1. Validation des champs obligatoires
        if (!nom || !email || !mot_de_passe) {
            return res.status(400).json({ succes: false, message: 'Nom, email et mot de passe requis.' });
        }
        
        // Validation du rôle de l'utilisateur
        if (!['acheteur', 'vendeur'].includes(role)) {
            return res.status(400).json({ succes: false, message: 'Rôle invalide.' });
        }
        
        // Validation spécifique au rôle de vendeur
        if (role === 'vendeur' && !nom_boutique) {
            return res.status(400).json({ succes: false, message: 'Nom de boutique requis pour les vendeurs.' });
        }

        // 2. Vérification de l'unicité de l'email dans la base de données
        const [existants] = await db.query('SELECT id FROM utilisateurs WHERE email = ?', [email]);
        if (existants.length > 0) {
            return res.status(409).json({ succes: false, message: 'Cet email est déjà utilisé.' });
        }

        // 3. Sécurisation du mot de passe (Hachage avec Bcrypt)
        // Le sel '10' définit la complexité du hachage. Plus il est élevé, plus le hachage est sûr mais lent.
        const hash = await bcrypt.hash(mot_de_passe, 10);

        // 4. Insertion de l'utilisateur dans la table principale 'utilisateurs'
        const [resultat] = await db.query(
            'INSERT INTO utilisateurs (nom, email, mot_de_passe, role, telephone) VALUES (?, ?, ?, ?, ?)',
            [nom, email, hash, role, telephone || null]
        );
        const idUtilisateur = resultat.insertId; // Récupère l'identifiant auto-incrémenté généré par MySQL

        let vendeur_id = null;
        // 5. Si l'utilisateur est un vendeur, création du profil boutique associé dans la table 'vendeurs'
        if (role === 'vendeur') {
            const [resVendeur] = await db.query(
                'INSERT INTO vendeurs (nom_boutique, localisation, id_utilisateur) VALUES (?, ?, ?)',
                [nom_boutique, localisation || null, idUtilisateur]
            );
            vendeur_id = resVendeur.insertId; // Récupère l'ID du vendeur nouvellement créé
        }

        // 6. Génération automatique du jeton de session JWT
        // Le jeton contient le payload (les infos de base de l'utilisateur) et est expédié au client.
        const token = jwt.sign(
            { id: idUtilisateur, nom, email, role },
            process.env.JWT_SECRET || 'beautiful_women_secret',
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } // Expire après 7 jours par défaut
        );

        // Retourner la réponse de succès avec le jeton de connexion
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
// ROUTE : Connexion utilisateur
// URL : POST /api/auth/connexion
// Accès : Public
// Rôle : Vérifie les identifiants de l'utilisateur, compare le
//        mot de passe fourni au hash enregistré, et retourne
//        un jeton JWT valide si l'authentification réussit.
// ----------------------------------------------------------
router.post('/connexion', async (req, res) => {
    try {
        const { email, mot_de_passe } = req.body;

        // Validation des entrées obligatoires
        if (!email || !mot_de_passe) {
            return res.status(400).json({ succes: false, message: 'Email et mot de passe requis.' });
        }

        // 1. Recherche de l'utilisateur dans la base de données par son email
        // Seuls les utilisateurs 'actifs' (actif = 1) sont autorisés à se connecter.
        const [utilisateurs] = await db.query(
            'SELECT * FROM utilisateurs WHERE email = ? AND actif = 1',
            [email]
        );
        
        // Si l'adresse email n'existe pas en base
        if (utilisateurs.length === 0) {
            return res.status(401).json({ succes: false, message: 'Email ou mot de passe incorrect.' });
        }

        const utilisateur = utilisateurs[0];

        // 2. Comparaison et validation du mot de passe fourni avec le hash stocké en base
        const correspondance = await bcrypt.compare(mot_de_passe, utilisateur.mot_de_passe);
        if (!correspondance) {
            return res.status(401).json({ succes: false, message: 'Email ou mot de passe incorrect.' });
        }

        // 3. Génération du jeton JWT
        const token = jwt.sign(
            { id: utilisateur.id, nom: utilisateur.nom, email: utilisateur.email, role: utilisateur.role },
            process.env.JWT_SECRET || 'beautiful_women_secret',
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        // Récupérer le vendeur_id si l'utilisateur est un vendeur
        let vendeur_id = null;
        if (utilisateur.role === 'vendeur') {
            const [vendeurs] = await db.query(
                'SELECT id FROM vendeurs WHERE id_utilisateur = ?',
                [utilisateur.id]
            );
            if (vendeurs.length > 0) vendeur_id = vendeurs[0].id;
        }

        // Réponse avec le jeton et les informations publiques du profil
        res.json({
            succes: true,
            message: `Bon retour, ${utilisateur.nom} ! 🌺`,
            token,
            utilisateur: {
                id:        utilisateur.id,
                nom:       utilisateur.nom,
                email:     utilisateur.email,
                role:      utilisateur.role,
                photo:     utilisateur.photo,
                vendeur_id // null si acheteur ou admin
            }
        });

    } catch (err) {
        console.error('❌ Erreur connexion backend :', err);
        res.status(500).json({ succes: false, message: 'Erreur lors de la connexion.', erreur: err.message });
    }
});

// ----------------------------------------------------------
// ROUTE : Récupérer le profil de l'utilisateur connecté
// URL : GET /api/auth/profil
// Accès : Privé (Nécessite d'être authentifié via authMiddleware)
// Rôle : Retourne les informations complètes du profil utilisateur,
//        incluant les infos boutique si l'utilisateur est vendeur.
// ----------------------------------------------------------
router.get('/profil', authMiddleware, async (req, res) => {
    try {
        const id = req.utilisateur.id;

        // Récupérer les informations de base de l'utilisateur
        const [utilisateurs] = await db.query(
            'SELECT id, nom, email, telephone, role, photo FROM utilisateurs WHERE id = ? AND actif = 1',
            [id]
        );

        if (utilisateurs.length === 0) {
            return res.status(404).json({ succes: false, message: 'Utilisateur introuvable.' });
        }

        const utilisateur = utilisateurs[0];

        // Si l'utilisateur est un vendeur, récupérer également les infos de sa boutique
        if (utilisateur.role === 'vendeur') {
            const [vendeurs] = await db.query(
                'SELECT id, nom_boutique, description, localisation, logo, banniere, valide, note_moyenne FROM vendeurs WHERE id_utilisateur = ?',
                [id]
            );
            if (vendeurs.length > 0) {
                const v = vendeurs[0];
                utilisateur.vendeur_id    = v.id;
                utilisateur.nom_boutique  = v.nom_boutique;
                utilisateur.description   = v.description;
                utilisateur.localisation  = v.localisation;
                utilisateur.logo          = v.logo;
                utilisateur.banniere      = v.banniere;
                utilisateur.valide        = v.valide;
                utilisateur.note_moyenne  = v.note_moyenne;
            }
        }

        res.json({ succes: true, utilisateur });

    } catch (err) {
        console.error('Erreur récupération profil :', err);
        res.status(500).json({ succes: false, message: 'Erreur lors de la récupération du profil.' });
    }
});

// ----------------------------------------------------------
// ROUTE : Mise à jour du profil de l'utilisateur connecté
// URL : PUT /api/auth/profil
// Accès : Privé (Nécessite d'être authentifié via authMiddleware)
// Rôle : Modifie les informations personnelles (nom, téléphone, photo)
//        de l'utilisateur connecté en construisant dynamiquement la requête SQL.
// ----------------------------------------------------------
router.put('/profil', authMiddleware, async (req, res) => {
    try {
        const { nom, telephone, photo } = req.body;
        const id = req.utilisateur.id; // L'identifiant est extrait du token décodé par authMiddleware

        // Construction dynamique de la requête SQL d'update
        // Cela évite d'écraser des données si un paramètre n'est pas fourni dans req.body.
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

        // Si aucun champ à mettre à jour n'a été transmis
        if (updates.length === 0) {
            return res.status(400).json({ succes: false, message: 'Aucun champ à modifier.' });
        }

        // Ajout de l'identifiant pour la clause WHERE id = ?
        params.push(id);
        
        // Exécution de la requête SQL d'update dynamique
        await db.query(`UPDATE utilisateurs SET ${updates.join(', ')} WHERE id = ?`, params);

        res.json({ succes: true, message: 'Profil mis à jour avec succès !' });

    } catch (err) {
        console.error('Erreur mise à jour profil :', err);
        res.status(500).json({ succes: false, message: 'Erreur lors de la mise à jour du profil.' });
    }
});

module.exports = router;

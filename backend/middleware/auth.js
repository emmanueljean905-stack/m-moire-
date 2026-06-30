// ============================================================
// BEAUTIFUL WOMEN - Middleware d'authentification JWT
// Rôle : Sécuriser les routes de l'API en vérifiant la validité
//        du jeton d'accès (JWT) transmis par le client.
// ============================================================
const jwt = require('jsonwebtoken');

/**
 * Middleware de vérification du Token JWT.
 * 
 * Ce middleware intercepte la requête HTTP entrante, extrait le jeton JWT
 * contenu dans l'en-tête "Authorization" (au format "Bearer <token>"),
 * et tente de le décoder en utilisant la clé secrète de l'application.
 * 
 * En cas de succès :
 * - Les informations décodées de l'utilisateur sont injectées dans l'objet `req.utilisateur`.
 * - L'exécution se poursuit vers le middleware ou contrôleur suivant via `next()`.
 * 
 * En cas d'échec :
 * - Retourne une erreur 401 (Non autorisé) si aucun jeton n'est fourni.
 * - Retourne une erreur 403 (Accès interdit) si le jeton est invalide ou expiré.
 * 
 * @param {Object} req - Objet de requête Express
 * @param {Object} res - Objet de réponse Express
 * @param {Function} next - Fonction callback pour passer au middleware suivant
 */
const authMiddleware = (req, res, next) => {
    // Récupération de l'en-tête HTTP 'Authorization'
    const authHeader = req.headers['authorization'];
    // Extraction du jeton. Si l'en-tête est "Bearer MonToken", split(' ')[1] renvoie "MonToken"
    const token = authHeader && authHeader.split(' ')[1]; 

    // Si aucun jeton n'est présent dans la requête
    if (!token) {
        return res.status(401).json({
            succes: false,
            message: 'Accès refusé. Token de connexion manquant.'
        });
    }

    try {
        // Vérification et décodage du jeton avec la clé secrète JWT_SECRET définie dans .env
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'beautiful_women_secret');
        
        // Attacher les informations utilisateur décodées (ex: { id, nom, email, role }) à la requête
        req.utilisateur = decoded; 
        
        // Autoriser le passage à l'étape suivante (contrôleur ou middleware suivant)
        next();
    } catch (err) {
        // En cas d'erreur de signature, d'expiration ou de format du token
        return res.status(403).json({
            succes: false,
            message: 'Token de connexion invalide, altéré ou expiré.'
        });
    }
};

/**
 * Middleware d'autorisation basé sur les Rôles de l'utilisateur.
 * 
 * Permet de restreindre l'accès à certaines routes uniquement aux rôles spécifiés
 * (par exemple : 'acheteur', 'vendeur' ou 'admin').
 * Ce middleware doit impérativement être placé APRÈS `authMiddleware` afin que
 * `req.utilisateur` soit correctement renseigné.
 * 
 * @param {...String} roles - Liste des rôles autorisés à accéder à la ressource
 * @returns {Function} Middleware Express configuré pour ces rôles
 */
const roleMiddleware = (...roles) => {
    return (req, res, next) => {
        // Si les informations utilisateur ne sont pas chargées ou si le rôle n'est pas autorisé
        if (!req.utilisateur || !roles.includes(req.utilisateur.role)) {
            return res.status(403).json({
                succes: false,
                message: `Accès refusé. Cette action est réservée aux profils : ${roles.join(', ')}`
            });
        }
        // Si le rôle est validé, on continue vers le contrôleur
        next();
    };
};

module.exports = { authMiddleware, roleMiddleware };

// ============================================================
// BEAUTIFUL WOMEN - Middleware d'authentification JWT
// ============================================================
const jwt = require('jsonwebtoken');

/**
 * Vérifie le token JWT dans l'en-tête Authorization
 * Usage : router.get('/route-protegee', authMiddleware, handler)
 */
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer <token>"

    if (!token) {
        return res.status(401).json({
            succes: false,
            message: 'Accès refusé. Token manquant.'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'beautiful_women_secret');
        req.utilisateur = decoded; // { id, nom, email, role }
        next();
    } catch (err) {
        return res.status(403).json({
            succes: false,
            message: 'Token invalide ou expiré.'
        });
    }
};

/**
 * Vérifie que l'utilisateur a le rôle requis
 * Usage : router.post('/route', authMiddleware, roleMiddleware('vendeur'), handler)
 */
const roleMiddleware = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.utilisateur.role)) {
            return res.status(403).json({
                succes: false,
                message: `Accès réservé aux : ${roles.join(', ')}`
            });
        }
        next();
    };
};

module.exports = { authMiddleware, roleMiddleware };

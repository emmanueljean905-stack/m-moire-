const express = require('express');
const multer  = require('multer');
const path    = require('path');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Configuration du stockage Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // Nom de fichier unique : timestamp + extension d'origine
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Filtre pour n'accepter que les images
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Le fichier doit être une image !'), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // Limite à 2Mo
});

/**
 * POST /api/upload
 * Télécharge une image et retourne son URL locale
 */
router.post('/', authMiddleware, upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ succes: false, message: 'Aucun fichier téléchargé.' });
        }

        // On retourne le chemin relatif accessible via le serveur statique
        const url = `/uploads/${req.file.filename}`;
        
        res.json({
            succes: true,
            message: 'Image téléchargée avec succès !',
            url: url
        });

    } catch (err) {
        console.error('Erreur upload :', err);
        res.status(500).json({ succes: false, message: 'Erreur lors du téléchargement.' });
    }
});

module.exports = router;

// ============================================================
// BEAUTIFUL WOMEN - Routes API Upload (Téléversement)
// Rôle : Fournir un endpoint sécurisé pour le téléversement d'images
//        (produits, profils ou logos) vers le serveur backend.
//        Utilise Multer pour intercepter les fichiers et Sharp pour
//        les compresser automatiquement avant stockage (JPEG 80%).
//        - POST /api/upload → Uploader et optimiser un fichier image.
// ============================================================
const express = require('express');
const multer  = require('multer'); // Gestion upload multipart/form-data
const sharp   = require('sharp');  // Compression et redimensionnement d'images
const path    = require('path');
const fs      = require('fs');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// 1. Stockage temporaire en mémoire (Sharp traitera l'image avant de l'écrire sur disque)
const storage = multer.memoryStorage();

// 2. Filtre de sécurité : n'accepte que les images
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Format non supporté. Le fichier doit être une image !'), false);
    }
};

// 3. Initialisation de Multer (limite à 5 Mo pour le fichier brut avant compression)
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5 Mo max (avant compression)
});

// ----------------------------------------------------------
// ROUTE : Télécharger et optimiser une image sur le serveur
// URL : POST /api/upload
// Accès : Privé (Utilisateur connecté)
// ----------------------------------------------------------
router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ succes: false, message: 'Aucun fichier téléchargé.' });
        }

        // Génération d'un nom de fichier unique (toujours en .jpg après compression)
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const outputFilename = `image-${uniqueSuffix}.jpg`;
        const outputPath = path.join(__dirname, '..', 'uploads', outputFilename);

        // ✅ Compression automatique avec Sharp :
        //    - Redimensionne à max 1200px de large (sans agrandir une petite image)
        //    - Convertit en JPEG qualité 80% (excellent compromis qualité/poids)
        //    - Résultat typique : 900 Ko → 60-120 Ko (réduction de ~85%)
        await sharp(req.file.buffer)
            .resize({ width: 1200, withoutEnlargement: true }) // Ne jamais agrandir une petite image
            .jpeg({ quality: 80, progressive: true })           // JPEG progressif (s'affiche progressivement sur mobile)
            .toFile(outputPath);

        // Calcul de la taille finale pour les logs
        const stats = fs.statSync(outputPath);
        const tailleKo = Math.round(stats.size / 1024);
        console.log(`✅ Image optimisée : ${outputFilename} (${tailleKo} Ko, original: ${Math.round(req.file.size / 1024)} Ko)`);

        const url = `/uploads/${outputFilename}`;
        res.json({
            succes: true,
            message: `Image téléchargée et optimisée avec succès ! (${tailleKo} Ko)`,
            url: url
        });

    } catch (err) {
        console.error('Erreur upload/compression :', err);
        res.status(500).json({ succes: false, message: 'Erreur lors du traitement de l\'image.' });
    }
});

module.exports = router;

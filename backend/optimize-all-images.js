// ============================================================
// BEAUTIFUL WOMEN - Script d'Optimisation Globale des Images
// Rôle : Compresser toutes les images du site pour les rendre
//        légères et rapides à charger sur réseau mobile.
//
// Lance: node optimize-all-images.js
// ============================================================

const sharp = require('sharp');
const fs    = require('fs');
const path  = require('path');
const pool  = require('./config/db');

const IMAGES_DIR  = path.join(__dirname, '..', 'frontend', 'images');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

let totalSavedKo = 0;

// ── Compresser et redimensionner une seule image ────────────
async function compressImage(inputPath, outputPath, maxWidth = 800, quality = 70, keepPng = false) {
    if (!fs.existsSync(inputPath)) {
        console.log(`  ⚠️  Introuvable : ${inputPath}`);
        return null;
    }

    const statBefore = fs.statSync(inputPath);
    const extname    = path.extname(inputPath).toLowerCase();
    const tmpPath    = outputPath + '.tmp';
    const isLogo     = path.basename(inputPath).toLowerCase().includes('logo')
                    || path.basename(inputPath).toLowerCase().includes('payment');

    let pipeline = sharp(inputPath).resize({ width: maxWidth, withoutEnlargement: true });

    if (keepPng || (extname === '.png' && isLogo)) {
        // Conserver la transparence des logos et icônes de paiement
        await pipeline.png({ compressionLevel: 9 }).toFile(tmpPath);
        fs.renameSync(tmpPath, outputPath);
    } else {
        // Tout le reste → JPEG progressif (y compris les PNG produits)
        await pipeline.jpeg({ quality, progressive: true }).toFile(tmpPath);
        fs.renameSync(tmpPath, outputPath);
    }

    const statAfter = fs.statSync(outputPath);
    const avantKo   = Math.round(statBefore.size / 1024);
    const apresKo   = Math.round(statAfter.size / 1024);
    const gainPct   = Math.round((1 - statAfter.size / statBefore.size) * 100);
    totalSavedKo   += (statBefore.size - statAfter.size) / 1024;

    console.log(`  ✅ ${path.basename(outputPath).padEnd(35)} ${avantKo} Ko → ${apresKo} Ko  (−${gainPct}%)`);
    return { avant: avantKo, apres: apresKo };
}

// ── Compresser et convertir un PNG produit en JPG ──────────
async function convertPngToJpg(pngPath) {
    const jpgPath = pngPath.replace(/\.png$/i, '.jpg');
    await sharp(pngPath)
        .resize({ width: 750, withoutEnlargement: true })
        .jpeg({ quality: 70, progressive: true })
        .toFile(jpgPath);

    const statAfter = fs.statSync(jpgPath);
    console.log(`  🔄 PNG → JPG : ${path.basename(jpgPath)} (${Math.round(statAfter.size / 1024)} Ko)`);

    // Supprimer l'ancien PNG
    fs.unlinkSync(pngPath);
    return jpgPath;
}

// ── Mettre à jour les images PNG → JPG dans la base ────────
async function updateDatabasePngToJpg(pngFilename, jpgFilename) {
    try {
        // Mettre à jour la colonne images de la table produits
        const oldRef  = `/uploads/${pngFilename}`;
        const newRef  = `/uploads/${jpgFilename}`;
        const [res] = await pool.query(
            'UPDATE produits SET images = REPLACE(images, ?, ?) WHERE images LIKE ?',
            [oldRef, newRef, `%${pngFilename}%`]
        );
        if (res.affectedRows > 0) {
            console.log(`  🗄️  DB mis à jour : ${pngFilename} → ${jpgFilename} (${res.affectedRows} produit(s))`);
        }
    } catch (err) {
        console.error(`  ❌ Erreur DB pour ${pngFilename}:`, err.message);
    }
}

// ── Programme Principal ──────────────────────────────────────
async function main() {
    console.log('\n🌺 ================================================');
    console.log('   Beautiful Women - Optimisation Globale des Images');
    console.log('=================================================\n');

    // 1. IMAGES STATIQUES DU FRONTEND
    console.log('📁 Compression des images statiques (frontend/images/)...\n');

    const staticImages = [
        { file: 'hero-pagne.jpg',       maxWidth: 1200, quality: 75 }, // Bannière principale, garde plus de qualité
        { file: 'wax-ankara.jpg',       maxWidth: 800,  quality: 70 },
        { file: 'wax-hollandais.jpg',   maxWidth: 800,  quality: 70 },
        { file: 'kente-royal.jpg',      maxWidth: 800,  quality: 70 },
        { file: 'bogolan-mali.jpg',     maxWidth: 800,  quality: 70 },
        { file: 'bazin-brodee.jpg',     maxWidth: 800,  quality: 70 },
        { file: 'placeholder-pagne.jpg',maxWidth: 400,  quality: 75 },
        { file: 'logo-1.png',           maxWidth: 200,  quality: 85, keepPng: true },
        { file: 'logo-2.png',           maxWidth: 200,  quality: 85, keepPng: true },
        { file: 'payment-mtn.png',      maxWidth: 200,  quality: 85, keepPng: true },
        { file: 'payment-moov.png',     maxWidth: 200,  quality: 85, keepPng: true },
        { file: 'payment-orange.png',   maxWidth: 200,  quality: 85, keepPng: true },
        { file: 'payment-wave.png',     maxWidth: 200,  quality: 85, keepPng: true },
    ];

    for (const { file, maxWidth, quality, keepPng } of staticImages) {
        const filePath = path.join(IMAGES_DIR, file);
        await compressImage(filePath, filePath, maxWidth, quality, keepPng || false);
    }

    // 2. IMAGES PRODUITS UPLOADÉES (uploads/)
    console.log('\n📦 Compression des images produits (backend/uploads/)...\n');

    const uploadFiles = fs.readdirSync(UPLOADS_DIR);
    const imageFiles  = uploadFiles.filter(f => /\.(jpg|jpeg|png)$/i.test(f) && f !== '.gitkeep');

    for (const file of imageFiles) {
        const filePath = path.join(UPLOADS_DIR, file);
        const ext      = path.extname(file).toLowerCase();
        const stat     = fs.statSync(filePath);

        if (ext === '.png') {
            // Convertir les PNG produits en JPEG et mettre à jour la BDD
            const jpgPath     = await convertPngToJpg(filePath);
            const jpgFilename = path.basename(jpgPath);
            await updateDatabasePngToJpg(file, jpgFilename);
        } else if (stat.size > 50 * 1024) {
            // Compresser les JPG de plus de 50 Ko
            await compressImage(filePath, filePath, 750, 70);
        } else {
            console.log(`  ⏭️  Ignoré (déjà léger) : ${file} (${Math.round(stat.size / 1024)} Ko)`);
        }
    }

    // 3. RÉSUMÉ FINAL
    console.log('\n✨ ================================================');
    console.log(`   Terminé ! Gain total estimé : ~${Math.round(totalSavedKo)} Ko`);
    console.log('=================================================\n');

    process.exit(0);
}

main().catch(err => {
    console.error('❌ Erreur fatale :', err);
    process.exit(1);
});

// Script de compression des images statiques du frontend
// Lance: node compress-static-images.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, '..', 'frontend', 'images');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

async function compressImage(inputPath, outputPath, label) {
    const statBefore = fs.statSync(inputPath);
    const extname = path.extname(inputPath).toLowerCase();
    
    let pipeline = sharp(inputPath).resize({ width: 1400, withoutEnlargement: true });
    
    // Garder PNG pour les logos (transparence), JPEG pour le reste
    if (extname === '.png' && inputPath.includes('logo')) {
        await pipeline.png({ quality: 85, compressionLevel: 9 }).toFile(outputPath + '.tmp');
    } else {
        await pipeline.jpeg({ quality: 80, progressive: true }).toFile(outputPath + '.tmp');
        // Renommer le fichier avec extension .jpg si c'était un .png
        if (extname === '.png' && !inputPath.includes('logo') && !inputPath.includes('payment')) {
            // Pour les images de fond PNG, on garde le fichier original et on écrase juste en JPEG
        }
    }
    
    // Remplacer le fichier original
    if (fs.existsSync(outputPath + '.tmp')) {
        fs.renameSync(outputPath + '.tmp', outputPath);
    }
    
    const statAfter = fs.statSync(outputPath);
    const avant = Math.round(statBefore.size / 1024);
    const apres = Math.round(statAfter.size / 1024);
    const gain = Math.round((1 - statAfter.size / statBefore.size) * 100);
    console.log(`✅ ${label}: ${avant} Ko → ${apres} Ko (−${gain}%)`);
}

async function main() {
    console.log('\n🌺 Compression des images statiques Beautiful Women...\n');
    
    // Images frontend à compresser
    const frontendImages = [
        'hero-pagne.jpg',
        'wax-ankara.jpg',
        'wax-hollandais.jpg',
        'kente-royal.jpg',
        'bogolan-mali.jpg',
        'bazin-brodee.jpg',
        'placeholder-pagne.jpg'
    ];
    
    for (const img of frontendImages) {
        const inputPath = path.join(IMAGES_DIR, img);
        if (fs.existsSync(inputPath)) {
            await compressImage(inputPath, inputPath, img);
        } else {
            console.log(`⚠️  Ignoré (introuvable) : ${img}`);
        }
    }
    
    // Compresser aussi les images uploadées existantes (produits)
    console.log('\n📦 Compression des images produits uploadées...\n');
    const uploadFiles = fs.readdirSync(UPLOADS_DIR).filter(f => /\.(jpg|jpeg|png)$/i.test(f));
    let compressedCount = 0;
    
    for (const file of uploadFiles) {
        const inputPath = path.join(UPLOADS_DIR, file);
        const stat = fs.statSync(inputPath);
        // Compresser seulement les images > 200 Ko
        if (stat.size > 200 * 1024) {
            await compressImage(inputPath, inputPath, file);
            compressedCount++;
        }
    }
    
    console.log(`\n🎉 Terminé ! ${frontendImages.length} images frontend + ${compressedCount} images produits compressées.`);
    console.log('Les prochaines images uploadées seront compressées automatiquement.\n');
}

main().catch(console.error);

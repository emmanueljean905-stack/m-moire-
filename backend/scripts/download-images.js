const fs = require('fs');
const path = require('path');
const https = require('https');
const pool = require('../config/db');

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// S'assurer que le dossier uploads existe
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

function downloadImage(url, destPath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destPath);
        https.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                // Gestion des redirections (souvent le cas avec Unsplash)
                https.get(response.headers.location, (res) => {
                    res.pipe(file);
                    file.on('finish', () => {
                        file.close(resolve);
                    });
                }).on('error', (err) => {
                    fs.unlink(destPath, () => reject(err));
                });
            } else {
                response.pipe(file);
                file.on('finish', () => {
                    file.close(resolve);
                });
            }
        }).on('error', (err) => {
            fs.unlink(destPath, () => reject(err));
        });
    });
}

async function run() {
    try {
        console.log("🚀 Démarrage du téléchargement des images vers le dossier local...");
        const [rows] = await pool.query('SELECT id, nom, images FROM produits');
        let count = 0;

        for (const row of rows) {
            let imagesArr = [];
            try {
                imagesArr = typeof row.images === 'string' ? JSON.parse(row.images) : row.images;
            } catch (e) {
                console.error(`Erreur parse JSON ID ${row.id}`);
                continue;
            }

            if (!imagesArr || imagesArr.length === 0) continue;

            let updated = false;
            const newImagesArr = [];

            for (let i = 0; i < imagesArr.length; i++) {
                let imgUrl = imagesArr[i];
                if (imgUrl.startsWith('http')) {
                    const filename = `produit_${row.id}_${i}.jpg`;
                    const destPath = path.join(UPLOADS_DIR, filename);
                    
                    console.log(`⬇️ Téléchargement pour ID ${row.id} : ${imgUrl}`);
                    try {
                        await downloadImage(imgUrl, destPath);
                        const localUrl = `/uploads/${filename}`;
                        newImagesArr.push(localUrl);
                        updated = true;
                        console.log(`✅ Sauvegardé : ${localUrl}`);
                    } catch (err) {
                        console.error(`❌ Échec : ${err.message}`);
                        newImagesArr.push(imgUrl); // on garde l'ancien en cas d'erreur
                    }
                } else {
                    newImagesArr.push(imgUrl); // déjà en local
                }
            }

            if (updated) {
                const newImagesJson = JSON.stringify(newImagesArr);
                await pool.query('UPDATE produits SET images = ? WHERE id = ?', [newImagesJson, row.id]);
                console.log(`🔄 Base de données mise à jour pour le produit ${row.id}`);
                count++;
            }
        }
        
        console.log(`\n🎉 Terminé ! ${count} produits mis à jour pour utiliser des images locales.`);
        process.exit(0);
    } catch (err) {
        console.error("Erreur critique:", err);
        process.exit(1);
    }
}

run();

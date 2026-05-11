/**
 * BEAUTIFUL WOMEN - Script de Démarrage Démo
 * Ce script prépare l'environnement et lance le serveur.
 */
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log("\n🚀 Préparation de la démo Beautiful Women...");

// 1. Vérifier si le dossier uploads existe
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    console.log("📁 Création du dossier uploads...");
    fs.mkdirSync(uploadDir);
}

// 2. Tenter de tuer les processus sur le port 3000 (optionnel)
console.log("🧹 Nettoyage des ports...");

// 3. Lancer le serveur
console.log("\n🌺 Lancement du serveur...");
console.log("👉 Accès local : http://localhost:3000");
console.log("💡 Astuce : Utilisez Ngrok pour montrer le site sur votre téléphone !");
console.log("----------------------------------------------------------\n");

require('../server.js');

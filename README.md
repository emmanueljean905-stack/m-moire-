# Beautiful Women – Marketplace de Pagnes Africains 🌺

> Plateforme e-commerce multi-vendeurs de pagnes africains (Wax, Bazin, Kente, Bogolan), développée pour la Côte d'Ivoire.

## 🛠️ Stack Technique

- **Frontend** : HTML5, CSS3 (Vanilla), JavaScript ES6+
- **Backend** : Node.js + Express.js
- **Base de données** : MySQL
- **Paiement** : CinetPay (Mobile Money CI)
- **Cartes** : Leaflet.js + OpenStreetMap

## 🚀 Installation locale (XAMPP)

```bash
# 1. Cloner le projet
git clone https://github.com/votre-nom/beautiful-women.git
cd beautiful-women

# 2. Installer les dépendances backend
cd backend
npm install

# 3. Configurer l'environnement
cp .env.example .env
# Modifier .env avec vos valeurs locales

# 4. Démarrer MySQL dans XAMPP, puis importer la base
npm run db:import

# 5. Démarrer le serveur
npm start
```

Le site est accessible sur : **http://localhost:3000**

## 🌐 Déploiement en ligne

Voir le guide complet : [Guide de Déploiement Railway + Netlify](./DEPLOY.md)

## 📦 Scripts disponibles

```bash
npm start          # Démarrer le serveur (production)
npm run dev        # Démarrer avec nodemon (développement)
npm run db:import  # Importer le schéma SQL
npm run db:migrate # Appliquer les migrations
npm run db:seed    # Insérer les données de démo
npm run db:railway # Initialiser la base Railway (production)
```

## 🔑 Comptes de test

| Rôle | Email | Mot de passe |
|---|---|---|
| Admin | admin@beautifulwomen.ci | password123 |
| Vendeur | adjoua@gmail.com | password123 |
| Acheteur | mariame@gmail.com | password123 |

## 📁 Structure du projet

```
beautiful-women/
├── frontend/          # Pages HTML, CSS, JavaScript
│   ├── index.html
│   ├── catalogue.html
│   ├── auth.html
│   ├── css/
│   └── js/
├── backend/           # API Node.js/Express
│   ├── server.js
│   ├── routes/
│   ├── config/
│   ├── middleware/
│   ├── scripts/
│   └── uploads/
└── database/
    └── beautiful_women.sql
```

---

© 2026 Beautiful Women – Fait avec ❤️ à Abidjan, Côte d'Ivoire 🇨🇮

# 🎓 Guide de Soutenance - Beautiful Women Marketplace

Ce document est votre "antisèche" pour préparer votre présentation devant le jury. Il récapitule les aspects techniques, les choix architecturaux et propose un scénario de démonstration.

---

## 🚀 Lancer la Démo
Pour lancer le projet rapidement :
1.  Ouvrez **XAMPP** et lancez **Apache** et **MySQL**.
2.  Dans le dossier `backend`, lancez : `npm run demo`.
3.  Accédez à : `http://localhost:3000`.
4.  *(Optionnel)* Pour mobile, utilisez Ngrok : `ngrok http 3000`.

---

## 1. Description du Projet
**Beautiful Women** est une marketplace spécialisée dans les textiles africains (Wax, Bazin, Kente, Bogolan). Le but est de digitaliser le commerce des pagnes en Côte d'Ivoire en connectant directement les vendeuses des marchés (Adjamé, Treichville) aux clientes via une plateforme moderne.

## 2. Pile Technologique (Stack Technique)
*   **Frontend** : HTML5, CSS3 (Vanilla), JavaScript (ES6+).
*   **Backend** : Node.js avec le framework **Express**.
*   **Base de données** : MySQL (géré via XAMPP/phpMyAdmin).
*   **Authentification** : JWT (JSON Web Tokens) pour une gestion sécurisée des sessions.
*   **Sécurité** : Hachage des mots de passe en base avec **bcryptjs**.
*   **Gestion d'images** : Stockage local (extensible vers Cloudinary).

## 3. Architecture du Système
Le projet suit une architecture **Client-Serveur** avec une séparation claire :
*   **Backend API** : Gère la logique métier, l'accès aux données et la sécurité.
*   **Frontend SPA-like** : Utilise l'API `fetch` pour charger les données de manière asynchrone sans recharger la page.
*   **Middleware** : Utilisation de `cors` pour la sécurité et de `multer` pour le traitement des fichiers (images).

---

## 🛠️ Corrections de Dernière Minute
1.  **Authentification** : Correction des redirections (utilisation de chemins relatifs `index.html` au lieu de `/index.html`) pour assurer le bon fonctionnement dans les sous-dossiers XAMPP.
2.  **Base de Données** : Configuration de `DB_HOST=127.0.0.1` pour résoudre les problèmes de connexion sur Windows.

> [!TIP]
> **Astuce Technique** : Si une redirection semble encore échouer, faites un **Ctrl + F5** dans votre navigateur pour vider le cache et forcer le chargement de la nouvelle version des scripts JavaScript.

## 4. Points Forts à Mettre en Avant
1.  **Expérience Utilisateur (UX)** : Design premium avec micro-animations (Scroll Reveal) et interface "Mobile First".
2.  **Double Interface** : Espace dédié pour les **Acheteurs** (commandes, profil) et pour les **Vendeurs** (tableau de bord, gestion de stock).
3.  **Simulateur de Livraison (Exclusivité)** : Système unique permettant de simuler en temps réel le trajet d'un colis du vendeur au client (idéal pour la démonstration au jury).
4.  **Flexibilité de Configuration** : Le frontend détecte automatiquement l'URL du serveur (XAMPP ou Node direct), assurant une portabilité maximale.
5.  **Sécurité** : Protection des données utilisateurs (mots de passe hachés, jetons JWT).

---

## 🎭 Scénario de Démonstration Idéal
*Temps estimé : 5 minutes*

1.  **Vitrine (Accueil)** : Montrez le design premium, les animations au scroll et la section "Inspiration".
2.  **Exploration (Catalogue)** : Faites une recherche (ex: "Wax") et filtrez par catégorie.
3.  **Action (Panier)** : Ajoutez un produit au panier sans être connecté (montre la gestion locale).
4.  **Conversion (Commande)** : Connectez-vous avec le compte client, validez le panier et arrivez sur la page de paiement CinetPay (Demo Mode).
5.  **Gestion (Vendeur)** : Connectez-vous avec le compte vendeur pour montrer le tableau de bord et les statistiques.

---

## 🔑 Identifiants de Test
| Rôle | Email | Mot de passe |
| :--- | :--- | :--- |
| **Client** | `mariame@gmail.com` | `admin123` |
| **Vendeur** | `adjoua@gmail.com` | `admin123` |
| **Admin** | `admin@beautifulwomen.ci` | `admin123` |

---

## 5. Questions Probables du Jury & Réponses

*   **Q : Pourquoi avoir choisi Node.js plutôt que PHP pur ?**
    *   *R : Pour la rapidité d'exécution (non-bloquant) et la possibilité d'utiliser le même langage (JS) sur tout le projet.*
*   **Q : Comment gérez-vous la sécurité des paiements ?**
    *   *R : Actuellement, le système est prêt à intégrer des passerelles comme CinetPay ou Wave, car les données de commande sont centralisées et sécurisées.*
*   **Q : Le site est-il prêt pour la production ?**
    *   *R : Oui, la base est solide. Pour une mise en ligne réelle, il faudrait simplement déplacer le stockage des images sur un service cloud comme Cloudinary.*

---

## ✅ Checklist de dernière minute (Avant de passer devant le jury)
- [ ] Lancer **Apache** et **MySQL** dans XAMPP.
- [ ] Lancer le serveur Node.js (`npm run demo`).
- [ ] Tester la connexion au site sur `http://localhost:3000`.
- [ ] Préparer les identifiants de test sur un post-it ou dans un bloc-notes.
- [ ] Désactiver les notifications Windows (pour ne pas être dérangé).
- [ ] Vérifier la connexion internet (si vous utilisez des images Unsplash ou Ngrok).

---

---
*Bonne chance pour votre soutenance ! Vous avez un projet solide.* 🚀

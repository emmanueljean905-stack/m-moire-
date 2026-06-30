const {
    Document, Packer, Paragraph, TextRun, HeadingLevel,
    ImageRun, AlignmentType, Table, TableRow, TableCell,
    WidthType, BorderStyle, TableLayoutType, ShadingType,
    PageBreak, Tab, VerticalAlign, PageOrientation
} = require('docx');
const fs = require('fs');
const path = require('path');

// ── Chemins des screenshots ──────────────────────────────────
const IMG_DIR = 'C:\\Users\\creso\\.gemini\\antigravity-ide\\brain\\4d1331e0-3df2-45fa-a4b9-d5e03df6340c';

function img(filename) {
    try {
        const files = fs.readdirSync(IMG_DIR).filter(f => f.startsWith(filename) && f.endsWith('.png'));
        if (!files.length) { console.warn('⚠️ Image non trouvée:', filename); return null; }
        return fs.readFileSync(path.join(IMG_DIR, files[0]));
    } catch(e) { console.warn('⚠️ Erreur image:', filename, e.message); return null; }
}

// ── Helpers ──────────────────────────────────────────────────
const FONT = 'Times New Roman';
const FONT_SIZE = 24; // 12pt in half-points
const TITLE_COLOR = '1F3864';
const ACCENT = 'C0392B';

function h1(text) {
    return new Paragraph({
        text,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
        run: { font: FONT, bold: true, color: TITLE_COLOR }
    });
}
function h2(text) {
    return new Paragraph({
        text,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 150 }
    });
}
function h3(text) {
    return new Paragraph({
        text,
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 240, after: 120 }
    });
}
function p(text, opts = {}) {
    return new Paragraph({
        children: [new TextRun({ text, font: FONT, size: FONT_SIZE, ...opts })],
        spacing: { before: 100, after: 100, line: 360 },
        alignment: AlignmentType.JUSTIFIED
    });
}
function bold(text) { return p(text, { bold: true }); }
function space() { return new Paragraph({ text: '', spacing: { before: 100, after: 100 } }); }
function pageBreak() { return new Paragraph({ children: [new PageBreak()] }); }

function figureBlock(imgBuffer, caption, width = 580, height = 370) {
    const items = [];
    if (imgBuffer) {
        items.push(new Paragraph({
            children: [new ImageRun({ data: imgBuffer, transformation: { width, height } })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 80 }
        }));
    }
    items.push(new Paragraph({
        children: [new TextRun({ text: caption, font: FONT, size: 20, italics: true, color: '555555' })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 40, after: 200 }
    }));
    return items;
}

function tableRow(cells, header = false) {
    return new TableRow({
        children: cells.map(c => new TableCell({
            children: [new Paragraph({
                children: [new TextRun({ text: c, font: FONT, size: 22, bold: header, color: header ? 'FFFFFF' : '000000' })],
                alignment: AlignmentType.CENTER,
                spacing: { before: 60, after: 60 }
            })],
            shading: header ? { type: ShadingType.CLEAR, fill: '1F3864' } : undefined,
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 80, bottom: 80, left: 120, right: 120 }
        }))
    });
}

// ── Images ──────────────────────────────────────────────────
const imgHome        = img('home_page');
const imgCatalogue   = img('catalogue_page');
const imgAuth        = img('auth_page');
const imgContact     = img('contact_page');
const imgChat        = img('chat_agent_demo');
const imgChatBubble  = img('chatbot_bubble');
const imgChatOpen    = img('chatbot_open');
const imgPanier      = img('panier_page');
const imgProfil      = img('profil_page');
const imgProfilCmds  = img('profil_commandes');
const imgProduit     = img('produit_detail');
const imgDashboard   = img('vendor_dashboard_1');
const imgOrders      = img('vendor_orders');


// ── Contenu du document ─────────────────────────────────────
const children = [

    // ════════════════════════════════════════════════════════
    // CHAPITRE V
    // ════════════════════════════════════════════════════════
    h1('CHAPITRE V : ENVIRONNEMENT DE TRAVAIL'),
    space(),

    h2('I. ENVIRONNEMENT DE DÉVELOPPEMENT'),
    space(),

    h3('I.1 Ressources matérielles'),
    p('Pour la mise en place de notre solution Beautiful Women, nous avons eu recours à un ordinateur portable dont les caractéristiques sont résumées dans le tableau suivant :'),
    space(),

    // Tableau matériel
    new Paragraph({ children: [new TextRun({ text: 'Tableau 1 : Caractéristiques de l\'appareil utilisé', font: FONT, size: 22, bold: true, italics: true })], alignment: AlignmentType.CENTER, spacing: { before: 120, after: 80 } }),
    new Table({
        layout: TableLayoutType.FIXED,
        width: { size: 9000, type: WidthType.DXA },
        rows: [
            tableRow(['Caractéristique', 'Détail'], true),
            tableRow(['Système d\'exploitation', 'Windows 11 Home 64 bits']),
            tableRow(['Processeur', 'Intel Core i5 – 4 cœurs – 2.4 GHz']),
            tableRow(['Stockage', 'SSD 512 Go']),
            tableRow(['Mémoire vive (RAM)', '8 Go DDR4']),
            tableRow(['Carte graphique', 'Intel UHD Graphics intégrée']),
            tableRow(['Logiciel serveur local', 'XAMPP v3.3.0 (Apache + MySQL)']),
        ]
    }),
    space(),

    h3('I.2 Ressources logicielles'),
    space(),

    h3('I.2.1 XAMPP'),
    p('XAMPP est une distribution Apache libre et multi-plateforme contenant Apache, MySQL, PHP et Perl. Dans le cadre de notre projet Beautiful Women, XAMPP a servi d\'environnement de serveur local, permettant de faire fonctionner conjointement le serveur web Apache et le système de gestion de base de données MySQL sur notre poste de développement. Il a facilité la gestion de la base de données via phpMyAdmin et simulé un environnement de production réaliste.'),
    space(),

    h3('I.2.2 Visual Studio Code'),
    p('Développé par Microsoft pour Windows, Linux et macOS, Visual Studio Code est un éditeur de code source open source prenant en charge de nombreux langages grâce à ses extensions. Il propose, en plus de l\'éditeur, un débogueur intégré, la complétion intelligente du code (IntelliSense), l\'intégration Git native et un terminal intégré. Dans le cadre de notre projet, nous avons utilisé VS Code comme environnement de développement principal pour écrire l\'intégralité du code frontend (HTML, CSS, JavaScript) et backend (Node.js / Express.js).'),
    space(),

    h3('I.2.3 Node.js'),
    p('Node.js est un environnement d\'exécution JavaScript côté serveur, basé sur le moteur V8 de Google Chrome. Il permet d\'exécuter du JavaScript en dehors du navigateur et de créer des serveurs web performants grâce à son architecture événementielle et non bloquante. Dans notre projet, Node.js constitue le cœur du backend de la plateforme Beautiful Women, gérant les requêtes HTTP, l\'authentification JWT, les opérations en base de données et la logique métier de la marketplace.'),
    space(),

    // ════════════════════════════════════════════════════════
    h2('II. OUTILS DE DÉVELOPPEMENT'),
    p('Nous présentons ici les langages, frameworks et outils qui ont été essentiels pour le développement, la conception et les tests de notre solution Beautiful Women.'),
    space(),

    h3('II.1 Langages de Programmation'),
    space(),

    h3('II.1.1 Frontend'),
    p('• HTML5 est le langage de balisage standard du web. Nous l\'avons utilisé pour structurer l\'ensemble des pages de la marketplace : page d\'accueil, catalogue, fiche produit, panier, profil client, dashboard vendeur et page de contact.'),
    space(),
    p('• CSS3 est le langage de feuilles de style utilisé pour définir l\'apparence visuelle des pages HTML. Nous avons opté pour du CSS Vanilla (sans framework) afin d\'avoir un contrôle total sur le design. Nous avons mis en œuvre des variables CSS, des animations, le glassmorphism, des gradients et un design entièrement responsive adapté aux mobiles et ordinateurs.'),
    space(),
    p('• JavaScript (ES6+) est le langage de programmation côté client qui orchestre toute la logique interactive de la plateforme : appels API, gestion du panier, simulation de livraison en temps réel, chatbot IA Adjoua, authentification et gestion des sessions utilisateur via localStorage.'),
    space(),

    h3('II.1.2 Backend'),
    p('• Node.js / Express.js : Express.js est le framework web minimaliste utilisé pour construire l\'API RESTful du projet. Il gère le routage des requêtes HTTP, les middlewares d\'authentification JWT, la validation des données, la gestion des uploads d\'images (Multer) et la communication avec la base de données MySQL.'),
    space(),
    p('• SQL / MySQL : MySQL est le système de gestion de bases de données relationnelles utilisé pour stocker et gérer toutes les données du projet : utilisateurs, produits, commandes, catégories, avis, zones de livraison et paiements. Nous avons utilisé la bibliothèque mysql2 côté Node.js pour exécuter les requêtes avec support des Promises.'),
    space(),

    h3('II.2 Bibliothèques et Frameworks utilisés'),
    new Table({
        layout: TableLayoutType.FIXED,
        width: { size: 9000, type: WidthType.DXA },
        rows: [
            tableRow(['Bibliothèque', 'Rôle dans le projet'], true),
            tableRow(['express', 'Framework web pour le serveur Node.js']),
            tableRow(['mysql2', 'Connexion et requêtes MySQL avec Promises']),
            tableRow(['jsonwebtoken (JWT)', 'Authentification sécurisée par token']),
            tableRow(['bcryptjs', 'Hachage sécurisé des mots de passe']),
            tableRow(['multer', 'Upload et gestion des images produits']),
            tableRow(['dotenv', 'Gestion des variables d\'environnement']),
            tableRow(['cors', 'Autorisation des requêtes cross-origin']),
            tableRow(['Leaflet.js', 'Carte interactive pour la simulation de livraison']),
        ]
    }),
    space(),

    h3('II.3 Outils de conception et de modélisation'),
    p('• Figma est un outil de conception et de prototypage collaboratif basé sur le cloud. Nous l\'avons utilisé pour concevoir les maquettes de l\'interface utilisateur (UI) de la marketplace avant le développement, en définissant la palette de couleurs, la typographie et la disposition des composants.'),
    space(),
    p('• Draw.io (diagrams.net) est un outil en ligne gratuit pour créer des diagrammes. Nous l\'avons utilisé pour modéliser l\'architecture logicielle de la solution, le diagramme de classes UML pour la base de données et les diagrammes de cas d\'utilisation.'),
    space(),

    h3('II.4 Outils de gestion de versions et de test'),
    p('• Git / GitHub : Git est le système de contrôle de versions utilisé pour suivre l\'évolution du code source tout au long du développement. GitHub a servi de dépôt distant pour sauvegarder et partager le code du projet.'),
    space(),
    p('• Postman est un logiciel permettant de tester et documenter des API REST. Nous l\'avons utilisé pour tester chaque endpoint de notre API (authentification, produits, commandes, livraison) avant leur intégration côté frontend, en vérifiant les réponses JSON, les codes HTTP et la sécurité des routes protégées par JWT.'),
    space(),

    pageBreak(),

    // ════════════════════════════════════════════════════════
    // CHAPITRE VI
    // ════════════════════════════════════════════════════════
    h1('CHAPITRE VI : RÉSULTATS ET DISCUSSIONS'),
    space(),

    h2('I. PRÉSENTATION DE LA SOLUTION'),
    p('La plateforme Beautiful Women est une marketplace e-commerce dédiée à la vente de pagnes africains et de produits textiles traditionnels ivoiriens. Elle met en relation des vendeurs artisans avec des acheteurs, et propose une expérience d\'achat complète allant de la navigation dans le catalogue jusqu\'à la livraison simulée en temps réel. Nous présentons ci-dessous les principales interfaces de la solution.'),
    space(),

    h3('I.1 Page d\'Accueil'),
    p('La page d\'accueil constitue la vitrine principale de la marketplace. Elle présente un hero banner attrayant avec un appel à l\'action, une section de produits tendance, les catégories de pagnes disponibles et une barre de navigation complète permettant d\'accéder aux différentes rubriques du site.'),
    space(),
    ...figureBlock(imgHome, 'Figure 1 : Page d\'accueil de la marketplace Beautiful Women'),

    h3('I.2 Catalogue des Produits'),
    p('Le catalogue présente l\'ensemble des produits disponibles avec des fonctionnalités avancées de filtrage par catégorie, fourchette de prix et recherche par mot-clé. Chaque fiche produit affiche une image, le nom du produit, le prix en FCFA, la note moyenne et le nom de la boutique du vendeur. Le catalogue est paginé et trié dynamiquement.'),
    space(),
    ...figureBlock(imgCatalogue, 'Figure 2 : Catalogue des pagnes avec filtres et pagination'),

    h3('I.3 Authentification'),
    p('La page d\'authentification permet aux utilisateurs de créer un compte (acheteur ou vendeur) ou de se connecter. Le système utilise une authentification par token JWT (JSON Web Token) avec hachage bcrypt des mots de passe. Les tokens sont stockés côté client dans le localStorage et envoyés dans les en-têtes HTTP Authorization pour chaque requête protégée.'),
    space(),
    ...figureBlock(imgAuth, 'Figure 3 : Page d\'authentification – Connexion et Inscription'),

    h3('I.4 Page Contact et Service Client'),
    p('La page de contact propose un formulaire d\'envoi de message et les coordonnées de la boutique. Elle intègre également un bouton de discussion instantanée qui redirige vers une interface de chat simulée avec l\'agent IA Adjoua, offrant une expérience de service client moderne sans dépendance à un service tiers.'),
    space(),
    ...figureBlock(imgContact, 'Figure 4 : Page Contact avec formulaire et accès au chat agent'),

    h3('I.5 Chatbot IA Adjoua – Widget intégré'),
    p('La plateforme intègre un chatbot IA nommé Adjoua, accessible depuis toutes les pages via un bouton flottant orange en bas à droite de l\'écran. Au clic, une fenêtre de discussion s\'ouvre directement sur la page sans redirection. Adjoua accueille automatiquement l\'utilisateur et propose des suggestions rapides : voir le catalogue, comment commander, livraison et délais, devenir vendeur, modes de paiement. Le chatbot répond en temps réel grâce à un moteur de mots-clés intelligent.'),
    space(),
    ...figureBlock(imgChatBubble, 'Figure 5 : Bouton flottant du chatbot Adjoua sur la page d\'accueil', 600, 350),
    ...figureBlock(imgChatOpen, 'Figure 6 : Widget chatbot Adjoua ouvert – suggestions et réponses automatiques', 600, 380),

    h3('I.6 Page Contact et Chat Dédié'),
    p('La page de contact propose les coordonnées de la plateforme et un lien vers une interface de chat dédiée (style WhatsApp) avec l\'agent Adjoua. Cette page de chat enrichie permet des échanges plus longs et contextualisés avec l\'agent, avec un historique de conversation, des suggestions rapides et une indication de statut "En ligne".'),
    space(),
    ...figureBlock(imgContact, 'Figure 7 : Page Contact avec accès au chat agent dédié'),
    ...figureBlock(imgChat, 'Figure 8 : Chat agent Adjoua – réponse à une demande de suivi de commande'),

    h3('I.7 Fiche Produit'),
    p('La fiche produit affiche en détail toutes les informations d\'un article : galerie photos, nom, prix, description, stock disponible, boutique du vendeur, avis clients et notes. L\'acheteur peut sélectionner la quantité souhaitée et ajouter le produit à son panier d\'un seul clic. Un bouton d\'ajout aux favoris (cœur) permet de sauvegarder les articles pour les retrouver dans son espace profil.'),
    space(),
    ...figureBlock(imgProduit, 'Figure 9 : Fiche produit détaillée avec galerie, prix et bouton panier'),

    h3('I.8 Panier d\'Achat'),
    p('Le panier centralise tous les articles sélectionnés par l\'acheteur. Il affiche le récapitulatif des produits (image, nom, quantité, prix unitaire), le sous-total, les frais de livraison calculés dynamiquement selon la zone géographique choisie, et le montant total de la commande. Le client peut modifier les quantités, supprimer des articles et choisir son adresse de livraison avant de valider sa commande.'),
    space(),
    ...figureBlock(imgPanier, 'Figure 10 : Page panier avec récapitulatif de commande et calcul de livraison'),

    h3('I.9 Espace Client – Historique des Commandes'),
    p('L\'espace client (profil) donne accès à l\'historique complet des commandes passées avec leur statut en temps réel (en attente, payée, en livraison, livrée). Pour chaque commande, un bouton "Suivre" ouvre une carte interactive Leaflet.js qui simule le déplacement du livreur depuis la boutique jusqu\'à l\'adresse de livraison du client. Les sections "Mes Favoris" et "Mon Compte" complètent l\'espace client.'),
    space(),
    ...figureBlock(imgProfil, 'Figure 11 : Espace client – Profil utilisateur et navigation par onglets'),
    ...figureBlock(imgProfilCmds, 'Figure 12 : Section Mes Commandes avec historique et bouton de suivi de livraison'),

    h3('I.10 Dashboard Vendeur – Vue d\'ensemble'),
    p('Le tableau de bord vendeur offre une vue d\'ensemble complète de l\'activité de la boutique en temps réel : chiffre d\'affaires, nombre total de commandes et nombre de produits actifs. Ces indicateurs sont mis à jour automatiquement à chaque chargement. La barre latérale donne accès aux sections Tableau de bord, Mes Produits, Mes Commandes et Ma Boutique.'),
    space(),
    ...figureBlock(imgDashboard, 'Figure 13 : Tableau de bord principal du vendeur – KPIs et commandes récentes'),


    h3('I.11 Gestion des Commandes Vendeur'),
    p('La section de gestion des commandes présente chaque commande sous forme de carte moderne avec un indicateur de progression visuel en 4 étapes : En attente → Payée → En livraison → Livrée. Le vendeur dispose de boutons d\'action contextuels colorés pour faire avancer chaque commande. Lorsque la commande passe en livraison, un bouton "Simulation client" permet de déclencher une simulation de suivi en temps réel visible depuis l\'espace client.'),
    space(),
    ...figureBlock(imgOrders, 'Figure 14 : Section Commandes vendeur – Cartes avec progression et boutons d\'action'),


    space(),
    pageBreak(),

    // ════════════════════════════════════════════════════════
    h2('II. ESTIMATION BUDGÉTAIRE'),
    p('L\'évaluation financière permet d\'estimer le coût global du projet de développement de la plateforme Beautiful Women. L\'ensemble des dépenses est présenté dans le tableau ci-dessous.'),
    space(),

    new Paragraph({ children: [new TextRun({ text: 'Tableau 2 : Estimation Budgétaire du projet', font: FONT, size: 22, bold: true, italics: true })], alignment: AlignmentType.CENTER, spacing: { before: 120, after: 80 } }),
    new Table({
        layout: TableLayoutType.FIXED,
        width: { size: 9000, type: WidthType.DXA },
        rows: [
            tableRow(['Désignation', 'Prix unitaire', 'Fréquence / Quantité', 'Total (FCFA)'], true),
            tableRow(['Ordinateur portable', '650 000 FCFA', '1', '650 000']),
            tableRow(['Connexion Internet', '25 000 / mois', '3 mois', '75 000']),
            tableRow(['Hébergement domaine (prévu)', '30 000 / an', '1', '30 000']),
            tableRow(['Main d\'œuvre (dev)', '7 500 FCFA / jour', '360 heures (45 jours)', '337 500']),
            tableRow(['TOTAL', '', '', '1 092 500']),
        ]
    }),
    space(),

    // ════════════════════════════════════════════════════════
    h2('III. DISCUSSIONS ET PERSPECTIVES'),
    space(),

    h3('III.1 Les points forts'),
    p('Après trois (3) mois de développement, l\'analyse des résultats obtenus montre que la plateforme Beautiful Women est une réussite sur plusieurs aspects. Les objectifs initiaux, visant à digitaliser la commercialisation des pagnes africains et à proposer un espace structuré aux artisans ivoiriens, ont été atteints.'),
    space(),
    p('Premièrement, la marketplace offre une expérience utilisateur complète et intuitive. Les acheteurs peuvent parcourir le catalogue, filtrer les produits, ajouter au panier, passer commande et suivre leur livraison en temps réel sur une carte interactive grâce à une simulation avec Leaflet.js et OpenStreetMap.'),
    space(),
    p('Deuxièmement, le dashboard vendeur centralise l\'ensemble de la gestion boutique. Les vendeurs disposent d\'un workflow clair en 4 étapes pour traiter leurs commandes, d\'un système d\'upload d\'images pour leurs produits et d\'indicateurs de performance en temps réel.'),
    space(),
    p('Troisièmement, la sécurité de la plateforme est assurée par une authentification JWT, le hachage bcrypt des mots de passe, des middlewares de contrôle de rôles et une gestion robuste de la connexion à la base de données avec keep-alive et heartbeat automatique.'),
    space(),
    p('Enfin, l\'intégration de l\'agent IA Adjoua offre un service client moderne et disponible en permanence, simulant des échanges naturels avec les utilisateurs sur les sujets les plus fréquents (suivi, livraison, retours, inscription vendeur).'),
    space(),

    h3('III.2 Les limites et perspectives'),
    p('Bien que la plateforme Beautiful Women soit fonctionnelle et démonstrative, certaines limites doivent être soulignées. Premièrement, le système de paiement fonctionne en mode simulation (démo) car l\'intégration complète avec CinetPay nécessite un compte marchand réel et une validation en production. Dans le cadre de la soutenance, les paiements sont simulés pour permettre une démonstration complète du flux de commande.'),
    space(),
    p('Deuxièmement, la simulation de livraison repose sur un mécanisme de localStorage partagé entre onglets du même navigateur, ce qui constitue une approximation pour la démonstration. Une implémentation en production nécessiterait des WebSockets ou des Server-Sent Events pour une communication temps réel bidirectionnelle.'),
    space(),
    p('Pour l\'avenir, nous envisageons plusieurs évolutions majeures : l\'intégration de paiements réels via Mobile Money (Orange Money, MTN MoMo, Wave), le développement d\'une application mobile native (React Native ou Flutter), l\'implémentation d\'un véritable système de messagerie en temps réel via WebSockets, et l\'intégration d\'un moteur de recommandation basé sur l\'intelligence artificielle pour personnaliser l\'expérience d\'achat de chaque client.'),
    space(),

    pageBreak(),

    // ════════════════════════════════════════════════════════
    // CONCLUSION
    // ════════════════════════════════════════════════════════
    h1('CONCLUSION'),
    p('Au terme de cette étude, il convient de rappeler que notre projet avait pour objectif de concevoir et développer une marketplace e-commerce dédiée aux pagnes africains et aux textiles traditionnels ivoiriens, sous le nom de Beautiful Women. La réalisation de cet objectif a suivi une approche structurée, allant de l\'analyse des besoins et de l\'étude de l\'existant à la mise en œuvre technique d\'une solution full-stack complète, aboutissant à une plateforme qui se distingue par sa richesse fonctionnelle, son design moderne et son architecture robuste.'),
    space(),
    p('La plateforme Beautiful Women met en relation vendeurs artisans et acheteurs à travers une interface intuitive et professionnelle. Elle intègre un catalogue produits avec filtres avancés, un système d\'authentification sécurisé par JWT, un dashboard vendeur complet avec gestion des commandes en temps réel, une simulation de livraison géolocalisée et un agent IA de support client. L\'expérience acquise au cours de ce projet nous a permis de renforcer nos compétences en développement web full-stack, en conception de bases de données relationnelles, en sécurité des applications et en gestion de projet.'),
    space(),
    p('Ce travail ouvre la voie à de nombreuses évolutions futures, notamment l\'intégration de paiements mobiles réels, le développement d\'une application mobile native et l\'enrichissement de l\'intelligence artificielle de l\'agent Adjoua pour offrir des recommandations personnalisées et un accompagnement encore plus adapté aux réalités du commerce en Côte d\'Ivoire.'),
];

// ── Génération du fichier ────────────────────────────────────
const doc = new Document({
    styles: {
        paragraphStyles: [
            { id: 'Normal', name: 'Normal', run: { font: FONT, size: FONT_SIZE } }
        ]
    },
    sections: [{ children }]
});

Packer.toBuffer(doc).then(buffer => {
    const outPath = 'C:\\xampp\\htdocs\\memoire 1\\MEMOIRE_Chapitre_V_VI.docx';
    fs.writeFileSync(outPath, buffer);
    console.log('✅ Document généré avec succès :', outPath);
}).catch(err => {
    console.error('❌ Erreur:', err.message);
});

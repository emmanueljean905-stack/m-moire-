const {
    Document, Packer, Paragraph, TextRun, HeadingLevel,
    AlignmentType, Table, TableRow, TableCell,
    WidthType, ShadingType, PageBreak, VerticalAlign, TableLayoutType, ImageRun
} = require('docx');
const fs = require('fs');
const path = require('path');
const https = require('https');

const FONT = 'Times New Roman';
const FONT_SIZE = 24; // 12pt in half-points
const TITLE_COLOR = '1F3864';

// Helper function to download image from mermaid.ink
function downloadDiagram(mermaidCode, name) {
    return new Promise((resolve, reject) => {
        console.log(`⏳ Téléchargement du diagramme UML : ${name}...`);
        const b64 = Buffer.from(mermaidCode).toString('base64');
        const url = `https://mermaid.ink/img/${b64}`;
        
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`Erreur HTTP ${res.statusCode} pour ${name}`));
                return;
            }
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => {
                const buffer = Buffer.concat(chunks);
                console.log(`✅ Diagramme ${name} téléchargé avec succès (${Math.round(buffer.length/1024)} Ko)`);
                resolve(buffer);
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

function h1(text) {
    return new Paragraph({
        text,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
        run: { font: FONT, bold: true, color: TITLE_COLOR, size: 28 }
    });
}

function h2(text) {
    return new Paragraph({
        text,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 150 },
        run: { font: FONT, bold: true, color: '2E4F75', size: 24 }
    });
}

function h3(text) {
    return new Paragraph({
        text,
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 240, after: 120 },
        run: { font: FONT, bold: true, size: 22 }
    });
}

function p(text, opts = {}) {
    return new Paragraph({
        children: [new TextRun({ text, font: FONT, size: FONT_SIZE, ...opts })],
        spacing: { before: 100, after: 100, line: 360 },
        alignment: AlignmentType.JUSTIFIED
    });
}

function space() {
    return new Paragraph({ text: '', spacing: { before: 100, after: 100 } });
}

function pageBreak() {
    return new Paragraph({ children: [new PageBreak()] });
}

function figureBlock(imgBuffer, caption, width = 500, height = 350) {
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

// UML Diagram Definitions
const CLASS_DIAGRAM_MERMAID = `classDiagram
    class Utilisateur {
        +int id
        +string nom
        +string email
        +string mot_de_passe
        +string role
        +string telephone
        +boolean actif
    }
    class Vendeur {
        +int id
        +string nom_boutique
        +string description
        +string localisation
        +int id_utilisateur
    }
    class Produit {
        +int id
        +string nom
        +string description
        +decimal prix
        +int stock
        +JSON images
    }
    class Categorie {
        +int id
        +string nom
        +string slug
        +string icone
    }
    class Commande {
        +int id
        +string statut
        +decimal montant_total
        +string adresse_liv
    }
    class LigneCommande {
        +int id
        +int quantite
        +decimal prix_unitaire
    }
    class Paiement {
        +int id
        +decimal montant
        +string methode
        +string statut
        +string transaction_id
    }
    class ZoneLivraison {
        +int id
        +string nom
        +decimal frais
    }
    class Avis {
        +int id
        +int note
        +string commentaire
    }

    Utilisateur "1" -- "0..1" Vendeur : possede
    Vendeur "1" -- "0..*" Produit : vend
    Categorie "1" -- "0..*" Produit : contient
    Utilisateur "1" -- "0..*" Commande : passe
    Commande "1" -- "1..*" LigneCommande : contient
    Produit "1" -- "0..*" LigneCommande : concerne
    Commande "1" -- "0..1" Paiement : regle
    Commande "*" -- "0..1" ZoneLivraison : livree_dans
    Utilisateur "1" -- "0..*" Avis : redige
    Produit "1" -- "0..*" Avis : recoit`;

const ACTIVITY_DIAGRAM_MERMAID = `graph TD
    Start((● Début)) --> A[Validation du panier par l'acheteur]
    A --> B[Saisie des informations de livraison & choix du paiement]
    B --> C{Validation du paiement}
    C -- Succès --> D[Enregistrement de la commande & notification vendeur]
    C -- Échec --> E[Notification d'erreur & nouvelle tentative]
    E --> B
    D --> F[Préparation et expédition du colis]
    F --> G[Suivi GPS et remise du colis à l'acheteur]
    G --> H[Clôture de la commande & dépôt d'avis]
    H --> End((◉ Fin))`;

async function main() {
    try {
        // Download all UML diagrams
        const classImg = await downloadDiagram(CLASS_DIAGRAM_MERMAID, 'Diagramme de Classes UML');
        const activityImg = await downloadDiagram(ACTIVITY_DIAGRAM_MERMAID, 'Diagramme d\'Activités UML');

        const children = [
            // PAGE DE GARDE / TITRE
            new Paragraph({
                children: [new TextRun({ text: 'UNIVERSITÉ DE CONCEPTION ET DE DÉVELOPPEMENT', font: FONT, size: 28, bold: true })],
                alignment: AlignmentType.CENTER,
                spacing: { before: 400, after: 400 }
            }),
            space(),
            space(),
            new Paragraph({
                children: [new TextRun({ text: 'DOCUMENT DE SPÉCIFICATIONS ET MODÉLISATION UML', font: FONT, size: 36, bold: true, color: TITLE_COLOR })],
                alignment: AlignmentType.CENTER,
                spacing: { before: 800, after: 200 }
            }),
            new Paragraph({
                children: [new TextRun({ text: 'Plateforme E-Commerce de Textiles Africains "Beautiful Women" (Mon Woro Woro)', font: FONT, size: 24, italic: true })],
                alignment: AlignmentType.CENTER,
                spacing: { before: 100, after: 800 }
            }),
            space(),
            space(),
            space(),
            new Paragraph({
                children: [new TextRun({ text: 'Rédigé dans le cadre de la modélisation UML de la solution pour le mémoire', font: FONT, size: 20, italic: true })],
                alignment: AlignmentType.CENTER,
                spacing: { before: 1000 }
            }),
            pageBreak(),

            // INTRODUCTION
            h1('INTRODUCTION'),
            p('Pour le développement de la plateforme de vente de pagnes « Beautiful Women », nous avons choisi d\'adopter le langage de modélisation unifié UML (Unified Modeling Language). Cette méthode de modélisation orientée objet est le standard industriel privilégié pour l\'analyse, la conception et la documentation des systèmes d\'information modernes.'),
            p('UML permet de modéliser le système sous différentes perspectives (structurelle et comportementale). Cette approche garantit une grande flexibilité, une lisibilité optimale par les équipes techniques et métiers, et une parfaite adéquation avec l\'architecture logicielle de notre marketplace.'),
            p('Ce document détaille les quatre livrables fondamentaux de la modélisation UML mis en œuvre dans notre application :'),
            p('1. Le Diagramme de Classes UML pour définir la structure statique des données et leurs associations.'),
            p('2. Le Diagramme d\'Activités UML pour décrire le comportement dynamique et les workflows métiers.'),
            p('3. Le Schéma Relationnel UML formalisant la traduction vers la base de données relationnelle.'),
            p('4. Les Spécifications Physiques de la Base de Données présentant la structure SQL définitive sous MySQL.'),
            space(),
            pageBreak(),

            // DIAGRAMME DE CLASSES UML
            h1('I. DIAGRAMME DE CLASSES UML (Structure Statique)'),
            p('Le Diagramme de Classes UML représente la structure statique du système en illustrant ses classes, leurs attributs ainsi que les relations et multiplicités (0..1, 1..*, etc.) qui les lient, sans contrainte technique d\'implémentation.'),
            
            h2('I.1 Diagramme Graphique des Classes'),
            ...figureBlock(classImg, 'Figure 1 : Diagramme de Classes UML de la marketplace Beautiful Women', 500, 480),

            h2('I.2 Dictionnaire des Classes Métiers'),
            p('Les classes suivantes structurent la marketplace :'),
            p('• Utilisateur : Stocke les informations de profil des comptes (Acheteurs, Vendeurs et Administrateurs).'),
            p('• Vendeur : Modélise la boutique d\'un artisan ou commerçant de textile.'),
            p('• Produit : Représente un article textile (pagne Wax, Bazin, Kita) en vente.'),
            p('• Categorie : Permet de classifier les produits pour simplifier la recherche.'),
            p('• Commande : Enregistre la transaction et l\'historique d\'achat d\'un client.'),
            p('• Paiement : Enregistre le détail du règlement mobile (Wave, Orange Money, CinetPay).'),
            p('• ZoneLivraison : Tarif et localisation pour la livraison (ex : Cocody, Adjamé, Bouaké).'),
            p('• Avis : Permet aux acheteurs d\'attribuer une note et un commentaire sur les pagnes achetés.'),

            h2('I.3 Tableau des Associations et Multiplicités UML'),
            new Table({
                layout: TableLayoutType.FIXED,
                width: { size: 9000, type: WidthType.DXA },
                rows: [
                    tableRow(['Nom Association', 'Classes reliées', 'Multiplicités', 'Signification'], true),
                    tableRow(['posséder', 'Utilisateur - Vendeur', '1 -- 0..1', 'Un utilisateur possède 0 ou 1 boutique. Une boutique appartient à exactement 1 utilisateur.']),
                    tableRow(['vendre', 'Vendeur - Produit', '1 -- 0..*', 'Une boutique vend 0 à plusieurs produits. Un produit appartient à 1 seule boutique.']),
                    tableRow(['contenir', 'Categorie - Produit', '1 -- 0..*', 'Une catégorie contient 0 à n produits. Un produit appartient à 1 seule catégorie.']),
                    tableRow(['passer', 'Utilisateur - Commande', '1 -- 0..*', 'Un acheteur passe 0 à n commandes. Une commande est liée à 1 seul acheteur.']),
                    tableRow(['détailler', 'Commande - Produit', '1..* -- 0..*', 'Une commande contient 1 à n produits via la classe associative LigneCommande (avec attributs quantite et prix_unitaire).']),
                    tableRow(['régler', 'Commande - Paiement', '1 -- 0..1', 'Une commande est réglée par au plus 1 paiement. Un paiement est lié à 1 seule commande.']),
                    tableRow(['noter', 'Produit - Utilisateur', '0..* -- 0..*', 'Un utilisateur peut évaluer plusieurs produits via la classe Avis (avec attributs note et commentaire).'])
                ]
            }),
            space(),
            pageBreak(),

            // SCHÉMA RELATIONNEL & TRADUCTION UML
            h1('II. SCHÉMA RELATIONNEL ET TRADUCTION UML-RELATIONNELLE'),
            p('Le Schéma Relationnel découle directement du Diagramme de Classes UML. Il traduit les classes en tables et exprime les associations sous forme de clés primaires (soulignées) et de clés étrangères (précédées d\'un dièse #).'),

            h2('II.1 Règles de Passage du Diagramme de Classes au Schéma Relationnel'),
            p('1. Les classes métiers deviennent des tables relationnelles.'),
            p('2. Pour les associations de multiplicité 1 à 0..* ou 1..*, la clé primaire de la classe côté 1 migre comme clé étrangère dans la table côté *. Par exemple, id_utilisateur migre dans Vendeur.'),
            p('3. Les associations N-N (multiplicité * à *) se transforment en tables d\'association contenant les clés primaires des deux tables parentes.'),

            h2('II.2 Schéma Relationnel Textuel'),
            p('• UTILISATEUR (id, nom, email, mot_de_passe, role, telephone, actif)'),
            p('• VENDEUR (id, nom_boutique, description, localisation, #id_utilisateur)'),
            p('• PRODUIT (id, nom, description, prix, stock, images, #id_vendeur, #id_categorie)'),
            p('• CATEGORIE (id, nom, slug, icone)'),
            p('• COMMANDE (id, statut, montant_total, adresse_liv, #id_acheteur, #id_zone_livraison)'),
            p('• LIGNE_COMMANDE (#id_commande, #id_produit, quantite, prix_unitaire)'),
            p('• PAIEMENT (id, montant, methode, statut, transaction_id, #id_commande)'),
            p('• ZONE_LIVRAISON (id, nom, frais)'),
            p('• AVIS (id, note, commentaire, #id_produit, #id_utilisateur)'),
            p('• FAVORIS (#id_utilisateur, #id_produit)'),
            pageBreak(),

            // DIAGRAMME D'ACTIVITÉS UML
            h1('III. DIAGRAMME D\'ACTIVITÉS UML (Comportement Dynamique)'),
            p('Le Diagramme d\'Activités UML permet de modéliser le comportement dynamique du système et les workflows métiers. Il illustre l\'enchaînement des activités, les points de décision et les états finaux lors d\'une transaction.'),

            h2('III.1 Diagramme Graphique d\'Activités'),
            ...figureBlock(activityImg, 'Figure 2 : Diagramme d\'Activités UML du workflow d\'achat', 450, 480),

            h2('III.2 Concepts de Modélisation du Diagramme d\'Activités'),
            p('• État initial (●) : Point de départ déclenché par l\'acheteur (validation du panier).'),
            p('• Activités : Actions ou traitements exécutés par le système (ex : Enregistrement de la commande, Expédition).'),
            p('• Nœud de décision ({}) : Branchement logique orientant le flux selon les conditions (ex : Succès ou Échec du paiement).'),
            p('• État final (◉) : Fin du processus transactionnel (clôture et évaluation).'),
            pageBreak(),

            // SPÉCIFICATIONS PHYSIQUES DE LA BASE DE DONNÉES
            h1('IV. SPÉCIFICATIONS PHYSIQUES DE LA BASE DE DONNÉES (MySQL)'),
            p('Les spécifications physiques représentent l\'implémentation concrète de la base de données dans le Système de Gestion de Base de Données (SGBD) MySQL.'),

            h2('IV.1 Types SQL implémentés'),
            p('• Les clés primaires (id) sont déclarées en INT AUTO_INCREMENT pour optimiser l\'indexation.'),
            p('• Les mots de passe sont stockés en VARCHAR(255) car ils sont hachés avec l\'algorithme bcrypt.'),
            p('• Les champs de prix et montants utilisent le type DECIMAL(10,0) pour éviter les approximations de calcul inhérentes aux nombres flottants.'),
            p('• Le champ "images" de la table PRODUIT utilise le type JSON de MySQL pour stocker de façon flexible un tableau d\'URLs d\'images sans créer de table supplémentaire.'),
            
            h2('IV.2 Intégrité Référentielle (Clés étrangères)'),
            p('• ON DELETE CASCADE est appliqué sur VENDEUR(id_utilisateur) et PRODUIT(id_vendeur). Si un compte utilisateur ou vendeur est supprimé, toutes ses fiches produits ou informations de boutique associées sont nettoyées automatiquement en cascade.'),
            p('• ON DELETE RESTRICT est utilisé sur PRODUIT(id_categorie) pour empêcher la suppression d\'une catégorie de pagnes si des produits y sont encore associés, évitant ainsi d\'avoir des articles orphelins.'),
            p('• ON DELETE SET NULL est appliqué sur COMMANDE(id_zone_livraison) pour préserver l\'historique des ventes d\'une commande même si la zone de livraison venait à être modifiée ou supprimée des tarifs.')
        ];

        const doc = new Document({
            styles: {
                paragraphStyles: [
                    { id: 'Normal', name: 'Normal', run: { font: FONT, size: FONT_SIZE } }
                ]
            },
            sections: [{ children }]
        });

        const buffer = await Packer.toBuffer(doc);
        
        let outPath = 'C:\\xampp\\htdocs\\memoire 1\\UML_SPECIFICATIONS.docx';
        try {
            fs.writeFileSync(outPath, buffer);
            console.log('✅ Document UML généré avec succès avec images :', outPath);
        } catch (e) {
            if (e.code === 'EBUSY') {
                outPath = 'C:\\xampp\\htdocs\\memoire 1\\UML_SPECIFICATIONS_IMAGED.docx';
                fs.writeFileSync(outPath, buffer);
                console.log('⚠️ Fichier verrouillé par Word. Enregistré sous :', outPath);
            } else {
                throw e;
            }
        }
    } catch (err) {
        console.error('❌ Erreur lors de la génération du document UML:', err.message);
        process.exit(1);
    }
}

main();

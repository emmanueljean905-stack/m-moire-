const { Document, Packer, Paragraph, TextRun, AlignmentType, UnderlineType } = require('docx');
const fs = require('fs');

const FONT = 'Times New Roman';
const SZ   = 24; // 12pt

const INTRO_TEXT =
`En 2023, une étude de la Banque Mondiale révèle que plus de 70 % des petits commerçants ` +
`d'Afrique subsaharienne n'ont aucune présence numérique, malgré une pénétration d'Internet ` +
`mobile dépassant 40 % en Côte d'Ivoire. Ce paradoxe illustre un fossé persistant entre la ` +
`croissance du numérique et l'accès réel des artisans locaux aux outils du commerce en ligne. ` +
`Dans le secteur du textile ivoirien — pagnes Wax, Bazin, Kente et Bogolan — des milliers de ` +
`vendeuses exercent leur activité de façon informelle, sans vitrine numérique, sans gestion ` +
`structurée de leurs commandes et sans outil de suivi de livraison fiable. Ce manque de ` +
`numérisation les prive d'une clientèle élargie et les expose à des pertes liées à une gestion ` +
`manuelle peu sécurisée. Pourtant, dans un pays où l'usage du smartphone et des paiements ` +
`mobiles connaît une croissance rapide, la digitalisation du commerce artisanal apparaît ` +
`non seulement pertinente, mais urgente. C'est dans cette perspective que s'inscrit notre ` +
`projet intitulé « CONCEPTION ET DÉVELOPPEMENT D'UNE MARKETPLACE E-COMMERCE DÉDIÉE AUX ` +
`PAGNES AFRICAINS : CAS DE BEAUTIFUL WOMEN ». Ce travail vise à concevoir et développer ` +
`une plateforme web full-stack permettant aux artisans du textile ivoirien de gérer leur ` +
`boutique en ligne, de traiter les commandes et de suivre les livraisons en temps réel, ` +
`tout en offrant aux acheteurs une expérience d'achat moderne, sécurisée et culturellement ` +
`adaptée. Face à cet objectif, plusieurs interrogations ont guidé notre réflexion : ` +
`Comment concevoir une solution adaptée aux réalités du marché ivoirien, notamment aux zones ` +
`de livraison d'Abidjan et aux modes de paiement locaux ? Comment garantir la sécurité des ` +
`transactions entre vendeurs et acheteurs sans infrastructure bancaire formelle ? Comment ` +
`intégrer un service client intelligent et disponible en permanence sans recourir à des ` +
`prestataires externes coûteux ? Pour répondre à ces questions, notre travail est structuré ` +
`en six chapitres : nous présenterons d'abord le cadre général et l'analyse des besoins, ` +
`puis la modélisation et la conception du système, et enfin l'implémentation technique ` +
`et les résultats obtenus.`;

const doc = new Document({
    sections: [{
        children: [
            // Titre
            new Paragraph({
                children: [new TextRun({
                    text: 'INTRODUCTION',
                    font: FONT, size: 32, bold: true,
                    underline: { type: UnderlineType.SINGLE }
                })],
                alignment: AlignmentType.CENTER,
                spacing: { before: 400, after: 500 }
            }),
            // Un seul bloc de texte justifié
            new Paragraph({
                children: [new TextRun({ text: INTRO_TEXT, font: FONT, size: SZ })],
                alignment: AlignmentType.JUSTIFIED,
                spacing: { line: 360, before: 0, after: 0 },
                indent: { firstLine: 720 }
            })
        ]
    }]
});

Packer.toBuffer(doc).then(buf => {
    const out = 'C:\\xampp\\htdocs\\memoire 1\\INTRODUCTION.docx';
    fs.writeFileSync(out, buf);
    console.log('✅ Généré :', out, '—', Math.round(buf.length/1024), 'Ko');
}).catch(e => console.error('❌', e.message));

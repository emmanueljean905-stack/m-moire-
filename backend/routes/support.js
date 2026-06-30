// ============================================================
// BEAUTIFUL WOMEN - Routes Support & Contact
// Rôle : Recevoir et gérer les demandes d'assistance, réclamations
//        et messages de contact soumis par les visiteurs du site.
//        - POST /api/support/contact → Enregistrer un message de contact.
// ============================================================
const express = require('express');
const router = express.Router();

// ----------------------------------------------------------
// ROUTE : Formulaire de contact / assistance
// URL : POST /api/support/contact
// Accès : Public
// Rôle : Valide les champs du formulaire de contact et simule
//        l'envoi d'un courriel (ou le stockage) pour la soutenance.
// ----------------------------------------------------------
router.post('/contact', async (req, res) => {
    try {
        const { nom, email, sujet, message } = req.body;

        // 1. Validation minimale : s'assurer que les champs clés sont présents
        if (!nom || !email || !message) {
            return res.status(400).json({ succes: false, message: 'Veuillez remplir tous les champs obligatoires (nom, e-mail et message).' });
        }

        // 2. Simulation de l'acheminement (Log console)
        // Dans une application en production, ce bloc ferait appel à un service de mailer 
        // comme Nodemailer ou une API de messagerie (ex: SendGrid, Mailgun) pour notifier l'administrateur.
        console.log(`\n📬 NOUVEAU MESSAGE SUPPORT REÇU :`);
        console.log(`De : ${nom} (${email})`);
        console.log(`Sujet : ${sujet || 'Sans sujet'}`);
        console.log(`Message : ${message}\n`);

        res.json({ 
            succes: true, 
            message: 'Votre message a bien été transmis. Notre équipe vous répondra par e-mail dans les plus brefs délais. 🌺' 
        });
    } catch (err) {
        console.error('Erreur support :', err);
        res.status(500).json({ succes: false, message: 'Une erreur interne est survenue lors de l\'envoi du message.' });
    }
});

module.exports = router;

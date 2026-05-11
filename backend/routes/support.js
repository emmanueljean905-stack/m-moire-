// ============================================================
// BEAUTIFUL WOMEN - Routes Support & Contact
// ============================================================
const express = require('express');
const router = express.Router();

/**
 * POST /api/support/contact
 * Reçoit les messages du formulaire de contact
 */
router.post('/contact', async (req, res) => {
    try {
        const { nom, email, sujet, message } = req.body;

        if (!nom || !email || !message) {
            return res.status(400).json({ succes: false, message: 'Veuillez remplir les champs obligatoires.' });
        }

        // Pour la démo, on simule l'envoi d'email ou le stockage
        console.log(`\n📬 NOUVEAU MESSAGE SUPPORT :`);
        console.log(`De: ${nom} (${email})`);
        console.log(`Sujet: ${sujet || 'Sans sujet'}`);
        console.log(`Message: ${message}\n`);

        res.json({ 
            succes: true, 
            message: 'Votre message a été envoyé avec succès ! Notre équipe vous répondra dans les plus brefs délais.' 
        });
    } catch (err) {
        console.error('Erreur support :', err);
        res.status(500).json({ succes: false, message: 'Erreur lors de l\'envoi du message.' });
    }
});

module.exports = router;

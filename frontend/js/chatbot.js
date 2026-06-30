// ============================================================
// BEAUTIFUL WOMEN - Assistant IA "Adjoua" (chatbot.js)
// Rôle : Implémenter un agent conversationnel (chatbot) d'aide à la
//        clientèle nommé "Adjoua". Il fonctionne de manière autonome
//        au sein d'un module JavaScript (pattern IIFE). Il s'initialise
//        seul, injecte ses styles CSS et son code HTML dans la page,
//        et interagit en analysant les mots-clés du visiteur.
// ============================================================

const Chatbot = (() => {

    // ── BASE DE CONNAISSANCES LOCALE (KB) ─────────────────────────
    // Dictionnaire structurant les thématiques de support.
    // Chaque clé comprend :
    // - patterns : Liste de mots-clés surveillés pour déclencher cette réponse (sans accents/majuscules).
    // - responses : Liste de réponses potentielles choisies aléatoirement pour simuler du naturel.
    // - suggestions : Boutons d'actions rapides proposés au visiteur après la réponse.
    const KB = {
        salutations: {
            patterns: ['bonjour','bonsoir','salut','hello','hi','bonne nuit','coucou','yo','hey','bjr','bsr','slt'],
            responses: [
                "Bonjour ! 🌺 Je suis **Adjoua**, votre assistante Beautiful Women. Comment puis-je vous aider aujourd'hui ?",
                "Bonsoir et bienvenue ! 😊 Je suis **Adjoua**, à votre service. Que cherchez-vous ?",
                "Salut ! 👋 Je suis **Adjoua**, l'assistante de Beautiful Women. Je suis là pour vous aider !",
            ],
            suggestions: ["Voir le catalogue", "Comment commander ?", "Livraison & délais", "Devenir vendeur"]
        },
        catalogue: {
            patterns: ['catalogue','produit','pagne','wax','bazin','kente','bogolan','kita','ankara','tissu','acheter','voir','trouver','cherche'],
            responses: [
                "Bien sûr ! 🛍️ Notre catalogue propose **Wax, Bazin, Kente, Bogolan, Kita et Ankara**. Vous pouvez filtrer par catégorie, prix ou vendeur.\n\n👉 [Accéder au catalogue](/catalogue.html)",
                "Nous avons une belle sélection de pagnes africains authentiques ! 🧵\n\nVous pouvez parcourir notre **catalogue complet** ou chercher directement un tissu spécifique.",
            ],
            suggestions: ["Wax disponible ?", "Prix des pagnes", "Filtrer par prix", "Voir les vendeurs"]
        },
        commande: {
            patterns: ['commander','commande','acheter','panier','payer','paiement','achat','valider'],
            responses: [
                "Pour passer une commande, c'est simple ! 🛒\n\n1️⃣ Choisissez votre pagne dans le **catalogue**\n2️⃣ Cliquez sur le bouton **panier** 🛒\n3️⃣ Renseignez votre adresse de livraison\n4️⃣ Choisissez votre mode de **paiement** (Mobile Money, carte...)\n5️⃣ Confirmez votre commande ✅",
            ],
            suggestions: ["Modes de paiement", "Suivre ma commande", "Annuler une commande", "Retourner un article"]
        },
        livraison: {
            patterns: ['livraison','livrer','délai','délais','adresse','zone','ville','abidjan','livré','expédition','expédié'],
            responses: [
                "📦 **Livraison Beautiful Women**\n\n🏙️ **Abidjan & banlieue** : 24 à 48h — 1 500 FCFA\n🌍 **Intérieur CI** : 3 à 5 jours — 3 500 FCFA\n\nLa livraison est **gratuite** dès 50 000 FCFA d'achat. Vous pouvez suivre votre colis en temps réel dans votre espace client.",
            ],
            suggestions: ["Zones de livraison", "Suivre mon colis", "Commander maintenant", "Contacter le support"]
        },
        paiement: {
            patterns: ['paiement','payer','mobile money','mtn','orange money','moov','carte','virement','cash','visa'],
            responses: [
                "💳 **Modes de paiement acceptés** :\n\n📱 MTN Mobile Money\n📱 Orange Money\n📱 Moov Money\n💳 Carte bancaire (Visa/Mastercard)\n💵 Paiement à la livraison (Abidjan)\n\nTous vos paiements sont **100% sécurisés** par CinetPay.",
            ],
            suggestions: ["Comment payer avec MTN ?", "Paiement à la livraison", "Commander maintenant", "Aide & support"]
        },
        vendeur: {
            patterns: ['vendeur','vendre','boutique','vendeurs','vendeuse','inscription vendeur','devenir vendeur','créer boutique'],
            responses: [
                "Vous souhaitez vendre vos pagnes sur Beautiful Women ? Excellente idée ! 🌟\n\n**Pour devenir vendeur :**\n1️⃣ Créez un compte vendeur gratuitement\n2️⃣ Configurez votre boutique (logo, description)\n3️⃣ Ajoutez vos produits avec photos et prix\n4️⃣ Commencez à recevoir des commandes ! 🎉\n\n👉 [S'inscrire comme vendeur](/auth.html?mode=vendeur)",
            ],
            suggestions: ["Frais de commission ?", "Voir le tableau de bord", "Créer mon compte", "Contacter l'équipe"]
        },
        suivi: {
            patterns: ['suivi','suivre','commande','statut','où est','où en est','tracking','colis'],
            responses: [
                "Pour suivre votre commande 📦, connectez-vous à votre **espace client** et consultez l'onglet **Mes Commandes**. Vous verrez en temps réel l'état de votre livraison.\n\nSi vous avez un problème, contactez notre support ! 🤝",
            ],
            suggestions: ["Espace client", "Contacter le support", "Signaler un problème", "Retour produit"]
        },
        contact: {
            patterns: ['contact','joindre','appeler','téléphone','email','support','aide','problème','whatsapp'],
            responses: [
                "📞 **Contactez-nous :**\n\n💬 WhatsApp : +225 01 02 03 04 05\n📧 Email : support@beautifulwomen.ci\n🕐 Disponibles du **Lundi au Samedi, 8h à 19h**\n\n👉 [Page Contact](/contact.html)",
            ],
            suggestions: ["Envoyer un message", "WhatsApp direct", "Signaler un problème", "Retour à l'accueil"]
        },
        retour: {
            patterns: ['retour','retourner','rembours','échange','annuler','annulation','remboursement','insatisfait'],
            responses: [
                "🔄 **Politique de retour :**\n\nVous avez **7 jours** après réception pour signaler tout problème (taille, qualité, article incorrect).\n\nContactez notre support avec votre numéro de commande et nous nous occupons de tout ! 😊",
            ],
            suggestions: ["Contacter le support", "Signaler un problème", "Politique de retour", "Mon compte"]
        },
        perspectives: {
            patterns: ['perspective','quoi faire','aider','besoin','option','naviguer','guide','menu','quoi','que faire'],
            responses: [
                "Je suis là pour vous guider ! 🌟 Voici ce que je peux faire pour vous :\n\n🛍️ **Trouver un pagne** — parcourir le catalogue\n📦 **Passer commande** — guide étape par étape\n🚚 **Livraison** — zones et délais\n💳 **Paiement** — modes acceptés\n🏪 **Devenir vendeur** — créer votre boutique\n📞 **Support** — nous contacter\n\nQue souhaitez-vous ?",
            ],
            suggestions: ["Voir le catalogue", "Comment commander ?", "Devenir vendeur", "Contacter le support"]
        },
        merci: {
            patterns: ['merci','thanks','thank you','super','parfait','génial','excellent','bravo','nickel'],
            responses: [
                "Avec plaisir ! 🌸 N'hésitez pas si vous avez d'autres questions. Belle journée !",
                "De rien ! 😊 Beautiful Women est toujours à votre service !",
                "C'est moi qui vous remercie ! 🌺 À très bientôt sur Beautiful Women !",
            ],
            suggestions: ["Voir le catalogue", "Retour à l'accueil", "Contacter le support"]
        },
        inconnu: {
            responses: [
                "Je n'ai pas bien compris votre demande 🤔 Pouvez-vous reformuler ? Je peux vous aider avec :\n\n• Le **catalogue** et les produits\n• Les **commandes** et le panier\n• La **livraison** et les délais\n• Le **paiement** et les modes disponibles\n• Le **support** et les retours",
                "Hmm, je ne suis pas sûr de comprendre... 😅 Vous pouvez me poser des questions sur nos **produits**, **commandes**, **livraison** ou **paiements** !",
            ],
            suggestions: ["Voir le catalogue", "Comment commander ?", "Livraison & délais", "Modes de paiement"]
        }
    };

    // ── LOGIQUE D'ANALYSE SÉMANTIQUE DES QUESTIONS ────────────────
    /**
     * Analyse le message de l'utilisateur pour trouver une réponse adaptée.
     * Pour maximiser les chances de correspondance :
     * 1. Convertit en minuscules.
     * 2. Supprime les accents (Normalisation Unicode NFD).
     * 
     * @param {String} message - Entrée utilisateur
     * @returns {Object} { text: "réponse", suggestions: [] }
     */
    function getResponse(message) {
        // Normaliser le message (ex: "Délais de livraison" -> "delais de livraison")
        const msg = message.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        // Parcourir toutes les thématiques de la Base de Connaissances
        for (const [key, data] of Object.entries(KB)) {
            if (key === 'inconnu') continue; // Ignorer la clé par défaut
            // Vérifier si au moins un des motifs (patterns) est présent dans la question
            if (data.patterns && data.patterns.some(p => msg.includes(p))) {
                const resp = data.responses[Math.floor(Math.random() * data.responses.length)];
                return { text: resp, suggestions: data.suggestions || [] };
            }
        }
        
        // Si aucune correspondance n'est identifiée, renvoyer une réponse par défaut
        const resp = KB.inconnu.responses[Math.floor(Math.random() * KB.inconnu.responses.length)];
        return { text: resp, suggestions: KB.inconnu.suggestions || [] };
    }

    // ── COMPILATION DES BALISES MARKDOWN BASIQUES ──────────────────
    /**
     * Convertit la syntaxe markdown standard (**bold**, *italic*, [lien](url))
     * en balises HTML interprétables par le navigateur.
     * 
     * @param {String} text - Contenu brut de la réponse
     * @returns {String} HTML formaté
     */
    function renderMarkdown(text) {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:var(--orange);font-weight:600;">$1</a>')
            .replace(/\n/g, '<br>');
    }

    // ── ETAT INTERNE DE L'INTERFACE UTILISATEUR ──────────────────
    let isOpen = false;     // Statut du chat (ouvert/fermé)
    let isTyping = false;   // Statut de l'indicateur d'écriture

    // ── CRÉATION ET INJECTION DYNAMIQUE DU CHAT (HTML/CSS) ────────
    /**
     * Injecte les styles CSS nécessaires dans le head, et génère le
     * code HTML des boutons flottants et fenêtres de chat au bas de la page.
     */
    function createUI() {
        const css = `
        #bw-chatbot-btn {
            position: fixed; bottom: 28px; right: 28px;
            width: 62px; height: 62px;
            background: linear-gradient(135deg, var(--orange, #E87722), var(--or, #F4A900));
            border-radius: 50%; border: none; cursor: pointer;
            box-shadow: 0 8px 25px rgba(232,119,34,0.45);
            z-index: 9998;
            display: flex; align-items: center; justify-content: center;
            transition: transform 0.3s cubic-bezier(0.2,0.8,0.2,1), box-shadow 0.3s;
            animation: chatPulse 3s infinite;
        }
        @keyframes chatPulse {
            0%,100% { box-shadow: 0 8px 25px rgba(232,119,34,0.45); }
            50% { box-shadow: 0 8px 35px rgba(232,119,34,0.7), 0 0 0 8px rgba(232,119,34,0.1); }
        }
        #bw-chatbot-btn:hover { transform: scale(1.1); }
        #bw-chatbot-btn i { font-size: 1.5rem; color: white; }
        #bw-chatbot-notif {
            position: absolute; top: -4px; right: -4px;
            width: 20px; height: 20px;
            background: #e53935; border-radius: 50%;
            border: 2px solid white;
            font-size: 0.65rem; font-weight: 700; color: white;
            display: flex; align-items: center; justify-content: center;
        }
        #bw-chatbot-window {
            position: fixed; bottom: 105px; right: 28px;
            width: 370px; max-height: 520px;
            background: white;
            border-radius: 24px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.18);
            z-index: 9999; display: none; flex-direction: column;
            overflow: hidden;
            animation: chatOpen 0.35s cubic-bezier(0.2,0.8,0.2,1);
            border: 1px solid rgba(0,0,0,0.06);
        }
        @keyframes chatOpen {
            from { opacity:0; transform: scale(0.85) translateY(30px); }
            to { opacity:1; transform: scale(1) translateY(0); }
        }
        #bw-chatbot-header {
            background: linear-gradient(135deg, #3d1a05, #7a3d12);
            padding: 18px 20px;
            display: flex; align-items: center; gap: 12px;
            flex-shrink: 0;
        }
        .bw-chat-avatar {
            width: 42px; height: 42px; border-radius: 50%;
            background: linear-gradient(135deg, var(--orange,#E87722), var(--or,#F4A900));
            display: flex; align-items: center; justify-content: center;
            font-size: 1.2rem; flex-shrink: 0;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .bw-chat-header-info h4 { color: white; font-size: 0.95rem; font-weight: 700; margin: 0 0 2px; }
        .bw-chat-status { color: rgba(255,255,255,0.7); font-size: 0.72rem; display: flex; align-items: center; gap: 5px; }
        .bw-status-dot { width: 7px; height: 7px; background: #4caf50; border-radius: 50%; display: inline-block; animation: blink 1.5s infinite; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        #bw-chat-close { margin-left:auto; background:none; border:none; color:rgba(255,255,255,0.7); cursor:pointer; font-size:1.1rem; padding:4px 8px; border-radius:8px; transition:0.2s; }
        #bw-chat-close:hover { background:rgba(255,255,255,0.1); color:white; }
        #bw-chat-messages {
            flex: 1; overflow-y: auto; padding: 16px;
            display: flex; flex-direction: column; gap: 12px;
            background: #f8f9fc;
            max-height: 310px;
        }
        #bw-chat-messages::-webkit-scrollbar { width: 4px; }
        #bw-chat-messages::-webkit-scrollbar-track { background: transparent; }
        #bw-chat-messages::-webkit-scrollbar-thumb { background: #ddd; border-radius: 2px; }
        .bw-msg { display: flex; gap: 8px; align-items: flex-end; }
        .bw-msg.bot { flex-direction: row; }
        .bw-msg.user { flex-direction: row-reverse; }
        .bw-msg-avatar { width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#E87722,#F4A900);display:flex;align-items:center;justify-content:center;font-size:0.85rem;flex-shrink:0; }
        .bw-bubble {
            max-width: 82%; padding: 11px 15px;
            border-radius: 18px; font-size: 0.88rem; line-height: 1.55;
        }
        .bw-msg.bot .bw-bubble { background: white; color: #333; border-radius: 18px 18px 18px 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.07); }
        .bw-msg.user .bw-bubble { background: linear-gradient(135deg, #E87722, #F4A900); color: white; border-radius: 18px 18px 4px 18px; }
        .bw-typing { display:flex; gap:5px; align-items:center; padding:12px 15px; }
        .bw-typing span { width:8px;height:8px;background:#ccc;border-radius:50%;animation:typingDot 1.2s infinite; }
        .bw-typing span:nth-child(2){animation-delay:0.2s}
        .bw-typing span:nth-child(3){animation-delay:0.4s}
        @keyframes typingDot{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-8px);background:#E87722}}
        #bw-chat-suggestions {
            padding: 8px 12px; display: flex; flex-wrap: wrap; gap: 6px;
            background: white; border-top: 1px solid #f0f0f0;
            flex-shrink: 0;
        }
        .bw-suggestion {
            padding: 5px 12px; border-radius: 20px;
            border: 1.5px solid #e0e0e0; background: white;
            font-size: 0.75rem; color: #555; cursor: pointer;
            transition: all 0.2s; font-family: inherit; font-weight: 500;
        }
        .bw-suggestion:hover { background: var(--orange,#E87722); color: white; border-color: var(--orange,#E87722); transform: translateY(-1px); }
        #bw-chat-input-area {
            display: flex; gap: 8px; padding: 12px 14px;
            background: white; border-top: 1px solid #f0f0f0;
            flex-shrink: 0;
        }
        #bw-chat-input {
            flex:1; padding: 10px 14px; border: 2px solid #eee;
            border-radius: 25px; font-family: inherit; font-size: 0.88rem;
            outline: none; transition: border-color 0.2s;
            color: #333; background: #fafafa;
        }
        #bw-chat-input:focus { border-color: var(--orange,#E87722); background: white; }
        #bw-chat-send {
            width: 40px; height: 40px; border-radius: 50%;
            background: linear-gradient(135deg, var(--orange,#E87722), var(--or,#F4A900));
            border: none; cursor: pointer; color: white;
            display: flex; align-items: center; justify-content: center;
            transition: transform 0.2s, box-shadow 0.2s;
            box-shadow: 0 4px 12px rgba(232,119,34,0.3);
            flex-shrink: 0;
        }
        #bw-chat-send:hover { transform: scale(1.1); box-shadow: 0 6px 18px rgba(232,119,34,0.4); }
        @media (max-width: 480px) {
            #bw-chatbot-window { width: calc(100vw - 32px); right: 16px; bottom: 95px; }
            #bw-chatbot-btn { right: 16px; bottom: 16px; }
        }
        `;

        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);

        document.body.insertAdjacentHTML('beforeend', `
        <button id="bw-chatbot-btn" title="Assistant Adjoua" aria-label="Ouvrir le chatbot">
            <i class="fas fa-comment-dots"></i>
            <span id="bw-chatbot-notif">1</span>
        </button>

        <div id="bw-chatbot-window">
            <div id="bw-chatbot-header">
                <div class="bw-chat-avatar">🌺</div>
                <div class="bw-chat-header-info">
                    <h4>Adjoua — Assistante IA</h4>
                    <div class="bw-status-dot-wrap bw-chat-status">
                        <span class="bw-status-dot"></span> En ligne · Beautiful Women
                    </div>
                </div>
                <button id="bw-chat-close" title="Fermer"><i class="fas fa-times"></i></button>
            </div>
            <div id="bw-chat-messages"></div>
            <div id="bw-chat-suggestions"></div>
            <div id="bw-chat-input-area">
                <input id="bw-chat-input" type="text" placeholder="Écrivez votre message..." autocomplete="off" maxlength="300">
                <button id="bw-chat-send" title="Envoyer"><i class="fas fa-paper-plane"></i></button>
            </div>
        </div>
        `);

        bindEvents(); // Lier les contrôles d'événements JavaScript (clics, touches)
        setTimeout(() => showWelcome(), 600); // Déclencher le message de bienvenue avec un léger retard
    }

    /** Message de bienvenue initial */
    function showWelcome() {
        const hour = new Date().getHours();
        let greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";
        addBotMessage(
            `${greeting} ! 🌺 Je suis **Adjoua**, votre assistante Beautiful Women.\n\nJe suis là pour vous aider à trouver le pagne parfait, passer commande, ou répondre à toutes vos questions. Que puis-je faire pour vous ?`,
            ["Voir le catalogue", "Comment commander ?", "Livraison & délais", "Devenir vendeur", "Modes de paiement"]
        );
    }

    // ── EXPÉDITION DES MESSAGES DE L'AGENT Conversationnel ─────────
    /**
     * Simule la réflexion de l'agent en affichant un indicateur d'écriture
     * animé (typing dots), puis insère la réponse textuelle compilée.
     * 
     * @param {String} text - Contenu à afficher
     * @param {Array} suggestions - Liste de boutons de suggestions
     */
    function addBotMessage(text, suggestions = []) {
        const msgs = document.getElementById('bw-chat-messages');
        if (!msgs) return;

        // Créer un identifiant temporaire pour l'indicateur d'écriture
        const typingId = 'typing_' + Date.now();
        msgs.insertAdjacentHTML('beforeend', `
            <div class="bw-msg bot" id="${typingId}">
                <div class="bw-msg-avatar">🌺</div>
                <div class="bw-bubble bw-typing"><span></span><span></span><span></span></div>
            </div>
        `);
        msgs.scrollTop = msgs.scrollHeight; // Ajustement du scroll au bas de la fenêtre

        // Simulation du temps de réponse (aléatoire entre 0.9s et 1.4s)
        setTimeout(() => {
            const typing = document.getElementById(typingId);
            if (typing) typing.remove(); // Destruction de l'indicateur d'écriture

            // Insertion de la bulle de message finalisée
            msgs.insertAdjacentHTML('beforeend', `
                <div class="bw-msg bot">
                    <div class="bw-msg-avatar">🌺</div>
                    <div class="bw-bubble">${renderMarkdown(text)}</div>
                </div>
            `);
            msgs.scrollTop = msgs.scrollHeight;
            renderSuggestions(suggestions); // Affichage des suggestions associées
        }, 900 + Math.random() * 500);
    }

    /** Injection d'une bulle de message rédigée par l'utilisateur */
    function addUserMessage(text) {
        const msgs = document.getElementById('bw-chat-messages');
        if (!msgs) return;
        msgs.insertAdjacentHTML('beforeend', `
            <div class="bw-msg user">
                <div class="bw-bubble">${text.replace(/</g,'&lt;')}</div>
                <div class="bw-msg-avatar" style="background:linear-gradient(135deg,#3d1a05,#7a3d12);">👤</div>
            </div>
        `);
        msgs.scrollTop = msgs.scrollHeight;
    }

    /** Affiche les puces de suggestions interactives */
    function renderSuggestions(suggestions) {
        const container = document.getElementById('bw-chat-suggestions');
        if (!container) return;
        container.innerHTML = suggestions.map(s =>
            `<button class="bw-suggestion" onclick="window.Chatbot.sendSuggestion('${s.replace(/'/g, "\\'")}')">${s}</button>`
        ).join('');
    }

    /** Traite l'envoi d'une question, bloque l'écriture et appelle le moteur de réponses */
    function send(message) {
        if (!message.trim() || isTyping) return;
        addUserMessage(message);

        // Vider immédiatement les suggestions pour éviter les clics multiples incohérents pendant que l'IA réfléchit
        const container = document.getElementById('bw-chat-suggestions');
        if (container) container.innerHTML = '';

        const response = getResponse(message);
        isTyping = true;
        addBotMessage(response.text, response.suggestions);
        setTimeout(() => { isTyping = false; }, 1600); // Déverrouillage après émission
    }

    /** Attache les écouteurs d'événements du DOM (clics sur boutons et pression de la touche Entrée) */
    function bindEvents() {
        document.getElementById('bw-chatbot-btn').addEventListener('click', toggle);
        document.getElementById('bw-chat-close').addEventListener('click', close);
        document.getElementById('bw-chat-send').addEventListener('click', () => {
            const input = document.getElementById('bw-chat-input');
            if (input.value.trim()) { send(input.value); input.value = ''; }
        });
        document.getElementById('bw-chat-input').addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                const input = document.getElementById('bw-chat-input');
                if (input.value.trim()) { send(input.value); input.value = ''; }
            }
        });
    }

    // ── CONTRÔLES D'OUVERTURE ET FERMETURE ───────────────────────
    function toggle() {
        isOpen ? close() : open();
    }

    function open() {
        isOpen = true;
        const win = document.getElementById('bw-chatbot-window');
        const notif = document.getElementById('bw-chatbot-notif');
        const btn = document.getElementById('bw-chatbot-btn');
        win.style.display = 'flex';
        if (notif) notif.style.display = 'none'; // Masquer la pastille rouge de notification
        btn.querySelector('i').className = 'fas fa-times'; // Transforme l'icône bulle en croix de fermeture
    }

    function close() {
        isOpen = false;
        const win = document.getElementById('bw-chatbot-window');
        const btn = document.getElementById('bw-chatbot-btn');
        win.style.display = 'none';
        btn.querySelector('i').className = 'fas fa-comment-dots'; // Rétablit l'icône de bulle
    }

    // Exportation publique des API du module chatbot
    return {
        init: () => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', createUI);
            } else {
                createUI();
            }
        },
        sendSuggestion: (text) => {
            send(text);
            const input = document.getElementById('bw-chat-input');
            if (input) input.focus(); // Repositionne le focus d'écriture
        }
    };
})();

// Exposer globalement pour permettre l'exécution des handlers inline (ex: onclick dans le HTML dynamique)
window.Chatbot = Chatbot;

// Initialisation automatique du module
Chatbot.init();

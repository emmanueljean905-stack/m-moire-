// ============================================================
// BEAUTIFUL WOMEN - Gestion du Panier (localStorage)
// ============================================================

const PANIER_KEY = 'bw_panier';

const panier = {
    /** Retourne le tableau d'articles du panier */
    getArticles() {
        const data = localStorage.getItem(PANIER_KEY);
        return data ? JSON.parse(data) : [];
    },

    /** Alias pour getArticles (utilisé par panier-page.js) */
    get() {
        return this.getArticles();
    },

    /** Sauvegarde les articles dans localStorage */
    _sauvegarder(articles) {
        localStorage.setItem(PANIER_KEY, JSON.stringify(articles));
        this._mettreAJourBadge();
    },

    /** Ajouter un produit au panier */
    ajouter(produit, quantite = 1) {
        const articles = this.getArticles();
        const idx = articles.findIndex(a => a.id === produit.id);

        if (idx >= 0) {
            articles[idx].quantite += quantite;
        } else {
            articles.push({
                id:          produit.id,
                nom:         produit.nom,
                prix:        produit.prix,
                image:       Array.isArray(produit.images) ? produit.images[0] : produit.images,
                boutique:    produit.nom_boutique || '',
                quantite
            });
        }
        this._sauvegarder(articles);
        toast(`"${produit.nom}" ajouté au panier 🛍️`);
    },

    /** Retirer un produit */
    retirer(idProduit) {
        const articles = this.getArticles().filter(a => a.id !== idProduit);
        this._sauvegarder(articles);
    },

    /** Modifier la quantité d'un article */
    modifierQuantite(idProduit, quantite) {
        const articles = this.getArticles();
        const idx = articles.findIndex(a => a.id === idProduit);
        if (idx >= 0) {
            if (quantite <= 0) {
                articles.splice(idx, 1);
            } else {
                articles[idx].quantite = quantite;
            }
        }
        this._sauvegarder(articles);
    },

    /** Vider le panier */
    vider() {
        localStorage.removeItem(PANIER_KEY);
        this._mettreAJourBadge();
    },

    /** Calculer le total */
    getTotal() {
        return this.getArticles().reduce((sum, a) => sum + a.prix * a.quantite, 0);
    },

    /** Nombre total d'articles */
    getNbArticles() {
        return this.getArticles().reduce((sum, a) => sum + a.quantite, 0);
    },

    /** Mettre à jour le badge panier dans la navbar */
    _mettreAJourBadge() {
        const badge = document.getElementById('badge-panier');
        if (badge) {
            const nb = this.getNbArticles();
            badge.textContent = nb;
            badge.style.display = nb > 0 ? 'flex' : 'none';
        }
    },

    /** Formater un montant en FCFA (délégue à l'API pour cohérence) */
    formaterPrix(montant) {
        return api.formatPrice(montant);
    }
};

// Mise à jour du badge au chargement de chaque page
document.addEventListener('DOMContentLoaded', () => {
    try {
        panier._mettreAJourBadge();
    } catch (e) {
        console.warn("Badge non mis à jour localement");
    }
});

window.panier = panier;

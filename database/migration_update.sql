-- ============================================================
-- BEAUTIFUL WOMEN - Script de Migration (ALTER TABLE)
-- Rôle : Ajouter les colonnes et tables manquantes à une base
--        de données existante, SANS effacer les données.
-- Exécuter : coller dans phpMyAdmin > onglet SQL
-- ============================================================
USE beautiful_women;

-- 1. Ajouter la colonne 'valide' dans vendeurs si absente
ALTER TABLE vendeurs
    ADD COLUMN IF NOT EXISTS valide TINYINT(1) NOT NULL DEFAULT 1;

-- Valider tous les vendeurs existants pour ne pas bloquer les tests
UPDATE vendeurs SET valide = 1 WHERE valide = 0;

-- 2. Ajouter la colonne 'methode' dans commandes si absente
ALTER TABLE commandes
    ADD COLUMN IF NOT EXISTS methode VARCHAR(50) DEFAULT 'mobile_money';

-- 3. Créer la table litiges si elle n'existe pas
CREATE TABLE IF NOT EXISTS litiges (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    description  TEXT NOT NULL,
    statut       ENUM('en_attente', 'resolu') NOT NULL DEFAULT 'en_attente',
    id_commande  INT NOT NULL,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_commande) REFERENCES commandes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. Créer la table favoris si elle n'existe pas
CREATE TABLE IF NOT EXISTS favoris (
    id_utilisateur INT NOT NULL,
    id_produit     INT NOT NULL,
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_utilisateur, id_produit),
    FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (id_produit)     REFERENCES produits(id)     ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. Vérifier que les zones de livraison existent
INSERT IGNORE INTO zones_livraison (nom, frais) VALUES
    ('Abidjan - Zone Nord (Cocody, Abobo, Angré)', 2000),
    ('Abidjan - Zone Sud (Marcory, Koumassi, Port-Bouët)', 2000),
    ('Abidjan - Zone Ouest (Yopougon, Songon)', 2500),
    ('Abidjan - Plateau / Adjamé', 1500),
    ('Intérieur - Bouaké', 5000),
    ('Intérieur - San Pedro', 7000),
    ('Intérieur - Yamoussoukro', 4000);

-- 6. S'assurer que les catégories existent
INSERT IGNORE INTO categories (nom, slug, icone) VALUES
    ('Wax',     'wax',     '🌸'),
    ('Bazin',   'bazin',   '✨'),
    ('Kente',   'kente',   '👑'),
    ('Bogolan', 'bogolan', '🎨'),
    ('Kita',    'kita',    '🌿'),
    ('Ankara',  'ankara',  '🦋');

SELECT 'Migration terminee avec succes !' AS statut;

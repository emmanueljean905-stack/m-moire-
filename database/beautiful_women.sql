-- ============================================================
-- BEAUTIFUL WOMEN - Schéma SQL Complet v2
-- Marketplace multi-vendeurs de pagnes africains, Côte d'Ivoire
-- ============================================================

CREATE DATABASE IF NOT EXISTS beautiful_women CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE beautiful_women;

-- ============================================================
-- TABLE : UTILISATEURS
-- ============================================================
CREATE TABLE IF NOT EXISTS utilisateurs (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    nom           VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    mot_de_passe  VARCHAR(255) NOT NULL,
    role          ENUM('acheteur', 'vendeur', 'admin') NOT NULL DEFAULT 'acheteur',
    telephone     VARCHAR(20),
    photo         VARCHAR(255),
    actif         TINYINT(1) NOT NULL DEFAULT 1,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- TABLE : VENDEURS
-- ============================================================
CREATE TABLE IF NOT EXISTS vendeurs (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    nom_boutique    VARCHAR(150) NOT NULL,
    description     TEXT,
    localisation    VARCHAR(200),
    logo            VARCHAR(255),
    banniere        VARCHAR(255),
    note_moyenne    DECIMAL(3,2) DEFAULT 0.00,
    valide          TINYINT(1) NOT NULL DEFAULT 1,
    id_utilisateur  INT NOT NULL UNIQUE,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- TABLE : CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
    id    INT AUTO_INCREMENT PRIMARY KEY,
    nom   VARCHAR(100) NOT NULL UNIQUE,
    slug  VARCHAR(100) NOT NULL UNIQUE,
    icone VARCHAR(10)
) ENGINE=InnoDB;

INSERT IGNORE INTO categories (nom, slug, icone) VALUES
    ('Wax',     'wax',     '🌸'),
    ('Bazin',   'bazin',   '✨'),
    ('Kente',   'kente',   '👑'),
    ('Bogolan', 'bogolan', '🎨'),
    ('Kita',    'kita',    '🌿'),
    ('Ankara',  'ankara',  '🦋'),
    ('Couture & Modèles', 'couture-modeles', '👗');

-- ============================================================
-- TABLE : ZONES_LIVRAISON
-- ============================================================
CREATE TABLE IF NOT EXISTS zones_livraison (
    id    INT AUTO_INCREMENT PRIMARY KEY,
    nom   VARCHAR(100) NOT NULL UNIQUE,
    frais DECIMAL(10,0) NOT NULL DEFAULT 0
) ENGINE=InnoDB;

INSERT IGNORE INTO zones_livraison (nom, frais) VALUES
    ('Abidjan - Zone Nord (Cocody, Abobo, Angré)', 2000),
    ('Abidjan - Zone Sud (Marcory, Koumassi, Port-Bouët)', 2000),
    ('Abidjan - Zone Ouest (Yopougon, Songon)', 2500),
    ('Abidjan - Plateau / Adjamé', 1500),
    ('Intérieur - Bouaké', 5000),
    ('Intérieur - San Pedro', 7000),
    ('Intérieur - Yamoussoukro', 4000);

-- ============================================================
-- TABLE : PRODUITS
-- ============================================================
CREATE TABLE IF NOT EXISTS produits (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    nom          VARCHAR(200) NOT NULL,
    description  TEXT,
    prix         DECIMAL(10,0) NOT NULL,
    stock        INT NOT NULL DEFAULT 0,
    images       JSON,
    vues         INT NOT NULL DEFAULT 0,
    note_moyenne DECIMAL(3,2) DEFAULT 0.00,
    actif        TINYINT(1) NOT NULL DEFAULT 1,
    id_vendeur   INT NOT NULL,
    id_categorie INT NOT NULL,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_vendeur)   REFERENCES vendeurs(id)    ON DELETE CASCADE,
    FOREIGN KEY (id_categorie) REFERENCES categories(id)  ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE INDEX idx_produits_vendeur   ON produits(id_vendeur);
CREATE INDEX idx_produits_categorie ON produits(id_categorie);
CREATE INDEX idx_produits_prix      ON produits(prix);

-- ============================================================
-- TABLE : COMMANDES
-- ============================================================
CREATE TABLE IF NOT EXISTS commandes (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    statut          ENUM('en_attente','payee','en_livraison','livree','annulee') NOT NULL DEFAULT 'en_attente',
    montant_total   DECIMAL(10,0) NOT NULL,
    adresse_liv     TEXT,
    frais_livraison DECIMAL(10,0) NOT NULL DEFAULT 0,
    methode         VARCHAR(50) DEFAULT 'mobile_money',
    notes           TEXT,
    id_acheteur     INT NOT NULL,
    id_zone_livraison INT,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_acheteur)      REFERENCES utilisateurs(id)    ON DELETE RESTRICT,
    FOREIGN KEY (id_zone_livraison) REFERENCES zones_livraison(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- TABLE : LIGNES_COMMANDE
-- ============================================================
CREATE TABLE IF NOT EXISTS lignes_commande (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    quantite      INT NOT NULL DEFAULT 1,
    prix_unitaire DECIMAL(10,0) NOT NULL,
    id_commande   INT NOT NULL,
    id_produit    INT NOT NULL,
    FOREIGN KEY (id_commande) REFERENCES commandes(id) ON DELETE CASCADE,
    FOREIGN KEY (id_produit)  REFERENCES produits(id)  ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ============================================================
-- TABLE : LITIGES
-- ============================================================
CREATE TABLE IF NOT EXISTS litiges (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    description  TEXT NOT NULL,
    statut       ENUM('en_attente', 'resolu') NOT NULL DEFAULT 'en_attente',
    id_commande  INT NOT NULL,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_commande) REFERENCES commandes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- TABLE : AVIS
-- ============================================================
CREATE TABLE IF NOT EXISTS avis (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    note           TINYINT NOT NULL CHECK (note BETWEEN 1 AND 5),
    commentaire    TEXT,
    id_produit     INT NOT NULL,
    id_utilisateur INT NOT NULL,
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_produit)     REFERENCES produits(id)     ON DELETE CASCADE,
    FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    UNIQUE KEY uq_avis (id_produit, id_utilisateur)
) ENGINE=InnoDB;

-- ============================================================
-- TABLE : FAVORIS
-- ============================================================
CREATE TABLE IF NOT EXISTS favoris (
    id_utilisateur INT NOT NULL,
    id_produit     INT NOT NULL,
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_utilisateur, id_produit),
    FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (id_produit)     REFERENCES produits(id)     ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- TABLE : PAIEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS paiements (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    montant        DECIMAL(10,0) NOT NULL,
    methode        ENUM('cinetpay','wave','orange_money','moov_money','mobile_money') NOT NULL,
    statut         ENUM('en_attente','succes','echec','rembourse') NOT NULL DEFAULT 'en_attente',
    transaction_id VARCHAR(255) DEFAULT NULL,
    id_commande    INT NOT NULL UNIQUE,
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_commande) REFERENCES commandes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- DONNÉES DE DÉMONSTRATION (mot de passe commun : password123)
-- ============================================================
INSERT IGNORE INTO utilisateurs (nom, email, mot_de_passe, role, telephone) VALUES
    ('Admin Beautiful Women', 'admin@beautifulwomen.ci',
     '$2a$10$EOnPJM09WNSeLh/3Hu.6kOwVGQ5dCumXokqVhi4MzkX5H1elG6Jd6', 'admin', '+225 07 00 00 00 00'),
    ('Adjoua Kone', 'adjoua@gmail.com',
     '$2a$10$EOnPJM09WNSeLh/3Hu.6kOwVGQ5dCumXokqVhi4MzkX5H1elG6Jd6', 'vendeur', '+225 07 11 22 33 44'),
    ('Aminata Coulibaly', 'aminata@gmail.com',
     '$2a$10$EOnPJM09WNSeLh/3Hu.6kOwVGQ5dCumXokqVhi4MzkX5H1elG6Jd6', 'vendeur', '+225 05 44 55 66 77'),
    ('Mariame Toure', 'mariame@gmail.com',
     '$2a$10$EOnPJM09WNSeLh/3Hu.6kOwVGQ5dCumXokqVhi4MzkX5H1elG6Jd6', 'acheteur', '+225 01 88 99 00 11');

INSERT IGNORE INTO vendeurs (nom_boutique, description, localisation, valide, id_utilisateur) VALUES
    ('Wax Palace Adjoua', 'Les plus beaux wax d Abidjan, directement importes du Ghana', 'Treichville, Abidjan', 1, 2),
    ('Bazin d Or Aminata', 'Specialiste du bazin brode de qualite superieure', 'Adjame, Abidjan', 1, 3);

-- ============================================================
-- PRODUITS DE DÉMONSTRATION RÉELS
-- ============================================================
INSERT IGNORE INTO produits (id, nom, description, prix, stock, images, id_vendeur, id_categorie) VALUES
    (1, 'Super Wax Hollandais - Collection Royale', 'L''authentique Wax Hollandais avec des motifs dorés. Parfait pour les mariages et grandes cérémonies.', 45000, 10, '["/uploads/wax_hollandais_1.jpg"]', 1, 1),
    (2, 'Bazin Riche Guezner - Bleu Nuit', 'Bazin de première qualité, ultra brillant et résistant. Teinture artisanale faite à la main.', 65000, 10, '["/uploads/bazin_1.jpg"]', 2, 2),
    (3, 'Kente Ashanti Original - Couleurs Traditionnelles', 'Tissage main exporté directement du Ghana. Un tissu de prestige pour les chefs et reines-mères.', 120000, 10, '["/uploads/kente_1.jpg"]', 1, 3),
    (4, 'Pagne Bogolan Artisanal du Mali', 'Tissu traditionnel teint à la terre avec des motifs ancestraux. 100% coton bio.', 25000, 9, '["/uploads/bogolan_1.jpg"]', 2, 4),
    (6, 'Robe Sirène en Wax - Modèle ''Aya''', 'Magnifique robe sirène ajustée, cousue avec du Wax Hollandais. Idéale pour les sorties chics.', 35000, 9, '["/uploads/robe_wax_1.jpg"]', 1, 7),
    (7, 'Ensemble Veste & Pantalon Bazin', 'Ensemble moderne en Bazin riche, coupe cintrée et broderies fines. Style élégant et traditionnel.', 55000, 10, '["/uploads/ensemble_bazin_1.jpg"]', 2, 7),
    (15, 'Écharpe de Diplomate en Kente', 'Écharpe tissée main, accessoire idéal pour marquer son identité avec élégance.', 15000, 10, '["/uploads/produit_15_0.jpg"]', 2, 3),
    (30, 'Pagne Kita Authentique Tissé Main', 'Magnifique pagne Kita authentique, tissé à la main selon la tradition, idéal pour vos grandes cérémonies et événements spéciaux.', 45000, 10, '["/uploads/pagne_kita.jpg"]', 1, 5),
    (31, 'Robe de Soirée Ankara Moderne', 'Une création sur mesure en véritable tissu Ankara, coupe sirène avec finitions luxueuses, parfaite pour sublimer la silhouette.', 65000, 5, '["/uploads/modele_ankara.jpg"]', 1, 7),
    (32, 'Robe de Cérémonie Kente Royal', 'Une robe somptueuse conçue avec le plus fin tissu Kente, mariant tradition et haute couture pour vos cérémonies.', 85000, 1, '["/uploads/modele_kente.jpg"]', 1, 7),
    (33, 'Veste Moderne en Bogolan', 'Veste pour homme en authentique tissu Bogolan du Mali. Une coupe moderne pour un style élégant et culturel.', 45000, 4, '["/uploads/modele_bogolan.jpg"]', 1, 7),
    (34, 'Parure Royale Kita Traditionnelle', 'Tenue complète de la royauté Akan en Kita prestigieux, accompagnée de ses ornements. Un chef-d''œuvre culturel.', 120000, 1, '["/uploads/modele_kita.jpg"]', 1, 7),
    (35, 'Pagne Ankara Imprimé Floral', 'Véritable tissu Ankara aux motifs floraux vibrants. Idéal pour vos créations de mode contemporaine.', 25000, 15, '["/uploads/tissu_ankara.jpg"]', 1, 6);


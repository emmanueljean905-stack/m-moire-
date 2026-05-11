-- ============================================================
-- BEAUTIFUL WOMEN - Schéma SQL Complet
-- Marketplace multi-vendeurs de pagnes africains, Côte d'Ivoire
-- ============================================================

CREATE DATABASE IF NOT EXISTS beautiful_women CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE beautiful_women;

-- ============================================================
-- TABLE : UTILISATEURS
-- Contient acheteurs ET vendeurs (différenciés par le rôle)
-- ============================================================
CREATE TABLE utilisateurs (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    nom           VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    mot_de_passe  VARCHAR(255) NOT NULL,  -- Hashé avec bcrypt
    role          ENUM('acheteur', 'vendeur', 'admin') NOT NULL DEFAULT 'acheteur',
    telephone     VARCHAR(20),
    photo         VARCHAR(255),           -- URL Cloudinary
    actif         TINYINT(1) NOT NULL DEFAULT 1,
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- TABLE : VENDEURS
-- Chaque vendeur est lié à un utilisateur avec role='vendeur'
-- ============================================================
CREATE TABLE vendeurs (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    nom_boutique    VARCHAR(150) NOT NULL,
    description     TEXT,
    localisation    VARCHAR(200),          -- Ex: "Treichville, Abidjan"
    logo            VARCHAR(255),          -- URL Cloudinary
    banniere        VARCHAR(255),          -- URL Cloudinary
    note_moyenne    DECIMAL(3,2) DEFAULT 0.00,
    id_utilisateur  INT NOT NULL UNIQUE,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- TABLE : CATEGORIES
-- Types de pagnes africains
-- ============================================================
CREATE TABLE categories (
    id    INT AUTO_INCREMENT PRIMARY KEY,
    nom   VARCHAR(100) NOT NULL UNIQUE,
    slug  VARCHAR(100) NOT NULL UNIQUE,
    icone VARCHAR(10)
) ENGINE=InnoDB;

-- Catégories de pagnes africains
INSERT INTO categories (nom, slug, icone) VALUES
    ('Wax',     'wax',     '🌸'),
    ('Bazin',   'bazin',   '✨'),
    ('Kente',   'kente',   '👑'),
    ('Bogolan', 'bogolan', '🎨'),
    ('Kita',    'kita',    '🌿'),
    ('Ankara',  'ankara',  '🦋');

-- ============================================================
-- TABLE : ZONES_LIVRAISON
-- Secteurs géographiques et tarifs associés
-- ============================================================
CREATE TABLE zones_livraison (
    id    INT AUTO_INCREMENT PRIMARY KEY,
    nom   VARCHAR(100) NOT NULL UNIQUE,
    frais DECIMAL(10,0) NOT NULL DEFAULT 0
) ENGINE=InnoDB;

INSERT INTO zones_livraison (nom, frais) VALUES
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
CREATE TABLE produits (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    nom          VARCHAR(200) NOT NULL,
    description  TEXT,
    prix         DECIMAL(10,0) NOT NULL,   -- En Francs CFA
    stock        INT NOT NULL DEFAULT 0,
    images       JSON,                     -- Tableau d'URLs Cloudinary
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
CREATE TABLE commandes (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    statut         ENUM('en_attente','payee','en_livraison','livree','annulee')
                   NOT NULL DEFAULT 'en_attente',
    montant_total  DECIMAL(10,0) NOT NULL,
    adresse_liv    TEXT,
    frais_livraison DECIMAL(10,0) NOT NULL DEFAULT 0,
    notes          TEXT,
    id_acheteur    INT NOT NULL,
    id_zone_livraison INT,
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_acheteur) REFERENCES utilisateurs(id) ON DELETE RESTRICT,
    FOREIGN KEY (id_zone_livraison) REFERENCES zones_livraison(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- TABLE : LIGNES_COMMANDE
-- ============================================================
CREATE TABLE lignes_commande (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    quantite      INT NOT NULL DEFAULT 1,
    prix_unitaire DECIMAL(10,0) NOT NULL,
    id_commande   INT NOT NULL,
    id_produit    INT NOT NULL,
    FOREIGN KEY (id_commande) REFERENCES commandes(id)  ON DELETE CASCADE,
    FOREIGN KEY (id_produit)  REFERENCES produits(id)   ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ============================================================
-- TABLE : PAIEMENTS
-- ============================================================
CREATE TABLE paiements (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    montant         DECIMAL(10,0) NOT NULL,
    methode         ENUM('cinetpay','wave','orange_money','moov_money') NOT NULL,
    statut          ENUM('en_attente','succes','echec','rembourse') NOT NULL DEFAULT 'en_attente',
    transaction_id  VARCHAR(255),
    id_commande     INT NOT NULL UNIQUE,
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_commande) REFERENCES commandes(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- TABLE : AVIS
-- ============================================================
CREATE TABLE avis (
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
CREATE TABLE favoris (
    id_utilisateur INT NOT NULL,
    id_produit     INT NOT NULL,
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_utilisateur, id_produit),
    FOREIGN KEY (id_utilisateur) REFERENCES utilisateurs(id) ON DELETE CASCADE,
    FOREIGN KEY (id_produit)     REFERENCES produits(id)     ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- DONNÉES DE DÉMONSTRATION
-- ============================================================

-- Utilisateurs de test
INSERT INTO utilisateurs (nom, email, mot_de_passe, role, telephone) VALUES
    ('Admin Beautiful Women', 'admin@beautifulwomen.ci',
     '$2a$10$DjVGJ8IuXau/ZTnPeP9mARdpFr2V0Rmq.IB5MuEWExom', 'admin', '+225 07 00 00 00 00'),
    ('Adjoua Koné', 'adjoua@gmail.com',
     '$2a$10$DjVGJ8IuXau/ZTnPeP9mARdpFr2V0Rmq.IB5MuEWExom', 'vendeur', '+225 07 11 22 33 44'),
    ('Aminata Coulibaly', 'aminata@gmail.com',
     '$2a$10$DjVGJ8IuXau/ZTnPeP9mARdpFr2V0Rmq.IB5MuEWExom', 'vendeur', '+225 05 44 55 66 77'),
    ('Mariame Touré', 'mariame@gmail.com',
     '$2a$10$DjVGJ8IuXau/ZTnPeP9mARdpFr2V0Rmq.IB5MuEWExom', 'acheteur', '+225 01 88 99 00 11');

-- Vendeurs de test
INSERT INTO vendeurs (nom_boutique, description, localisation, id_utilisateur) VALUES
    ('Wax Palace Adjoua', 'Les plus beaux wax d\'Abidjan, directement importés du Ghana', 'Treichville, Abidjan', 2),
    ('Bazin d\'Or Aminata', 'Spécialiste du bazin brodé de qualité supérieure', 'Adjamé, Abidjan', 3);

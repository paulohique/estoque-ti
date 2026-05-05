-- Active: 1756851289822@@127.0.0.1@3306@estoqueti
-- Coloque aqui o schema inicial do banco (MySQL)

-- Exemplo de criacao do banco com collation utf8mb4_unicode_ci
-- CREATE DATABASE estoqueti
--   CHARACTER SET utf8mb4
--   COLLATE utf8mb4_unicode_ci;

-- Tabelas principais
CREATE DATABASE estoqueti
    DEFAULT CHARACTER SET = 'utf8mb4';
USE estoqueti;
CREATE TABLE IF NOT EXISTS roles (
	id INT AUTO_INCREMENT PRIMARY KEY,
	name VARCHAR(32) NOT NULL UNIQUE,
	description VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS permissions (
	id INT AUTO_INCREMENT PRIMARY KEY,
	code VARCHAR(64) NOT NULL UNIQUE,
	description VARCHAR(255) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS role_permissions (
	role_id INT NOT NULL,
	permission_id INT NOT NULL,
	PRIMARY KEY (role_id, permission_id),
	CONSTRAINT fk_role_perm_role FOREIGN KEY (role_id) REFERENCES roles(id),
	CONSTRAINT fk_role_perm_perm FOREIGN KEY (permission_id) REFERENCES permissions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
	id INT AUTO_INCREMENT PRIMARY KEY,
	username VARCHAR(64) NOT NULL UNIQUE,
	display_name VARCHAR(120) NOT NULL,
	email VARCHAR(160) NULL,
	password_hash VARCHAR(255) NULL,
	role_id INT NOT NULL,
	active TINYINT(1) NOT NULL DEFAULT 1,
	first_access_pending TINYINT(1) NOT NULL DEFAULT 0,
	last_login_at DATETIME NULL,
	deleted_at DATETIME NULL,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_permissions (
	user_id INT NOT NULL,
	permission_id INT NOT NULL,
	allowed TINYINT(1) NOT NULL DEFAULT 1,
	PRIMARY KEY (user_id, permission_id),
	CONSTRAINT fk_user_perm_user FOREIGN KEY (user_id) REFERENCES users(id),
	CONSTRAINT fk_user_perm_perm FOREIGN KEY (permission_id) REFERENCES permissions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sectors (
	id INT AUTO_INCREMENT PRIMARY KEY,
	name VARCHAR(120) NOT NULL UNIQUE,
	description VARCHAR(255) NULL,
	deleted_at DATETIME NULL,
	deleted_by INT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categories (
	id INT AUTO_INCREMENT PRIMARY KEY,
	name VARCHAR(120) NOT NULL UNIQUE,
	description VARCHAR(255) NULL,
	deleted_at DATETIME NULL,
	deleted_by INT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS items (
	id INT AUTO_INCREMENT PRIMARY KEY,
	category_id INT NULL,
	name VARCHAR(160) NOT NULL,
	category VARCHAR(64) NOT NULL,
	asset_tag VARCHAR(64) NULL,
	sku VARCHAR(64) NULL,
	serial_number VARCHAR(120) NULL,
	description TEXT NULL,
	responsible_name VARCHAR(160) NULL,
	item_status VARCHAR(32) NOT NULL DEFAULT 'em_estoque',
	location_name VARCHAR(160) NULL,
	supplier_name VARCHAR(160) NULL,
	invoice_number VARCHAR(64) NULL,
	purchase_date DATE NULL,
	purchase_value DECIMAL(12,2) NULL,
	image_path VARCHAR(512) NULL,
	qty_total INT NOT NULL DEFAULT 0,
	qty_min INT NOT NULL DEFAULT 0,
	deleted_at DATETIME NULL,
	deleted_by INT NULL,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT fk_items_category FOREIGN KEY (category_id) REFERENCES categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Caso a tabela ja exista, aplique os ALTERs abaixo:
-- ALTER TABLE items ADD COLUMN category_id INT NULL;
-- ALTER TABLE items ADD COLUMN asset_tag VARCHAR(64) NULL;
-- ALTER TABLE items ADD COLUMN image_path VARCHAR(512) NULL;
-- ALTER TABLE items ADD CONSTRAINT fk_items_category FOREIGN KEY (category_id) REFERENCES categories(id);

CREATE TABLE IF NOT EXISTS item_images (
	id INT AUTO_INCREMENT PRIMARY KEY,
	item_id INT NOT NULL,
	file_name VARCHAR(255) NOT NULL,
	file_path VARCHAR(512) NOT NULL,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT fk_item_images_item FOREIGN KEY (item_id) REFERENCES items(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS stock_movements (
	id INT AUTO_INCREMENT PRIMARY KEY,
	item_id INT NOT NULL,
	movement_type ENUM('in','out','transfer') NOT NULL,
	quantity INT NOT NULL,
	requested_by INT NOT NULL,
	sector_id INT NULL,
	glpi_ticket_number VARCHAR(64) NULL,
	glpi_comment_status VARCHAR(32) NULL,
	notes TEXT NULL,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT fk_stock_item FOREIGN KEY (item_id) REFERENCES items(id),
	CONSTRAINT fk_stock_user FOREIGN KEY (requested_by) REFERENCES users(id),
	CONSTRAINT fk_stock_sector FOREIGN KEY (sector_id) REFERENCES sectors(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
	id INT AUTO_INCREMENT PRIMARY KEY,
	entity_type VARCHAR(64) NOT NULL,
	entity_id INT NULL,
	action VARCHAR(32) NOT NULL,
	actor_user_id INT NULL,
	actor_username VARCHAR(64) NULL,
	ip_address VARCHAR(64) NULL,
	route_path VARCHAR(255) NULL,
	before_data LONGTEXT NULL,
	after_data LONGTEXT NULL,
	metadata_json LONGTEXT NULL,
	created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	INDEX idx_audit_entity (entity_type, entity_id),
	INDEX idx_audit_actor (actor_user_id),
	INDEX idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dados iniciais

INSERT IGNORE INTO roles (id, name, description) VALUES
	(1, 'admin', 'Administrador total'),
	(2, 'tecnico', 'Tecnico de TI'),
	(3, 'auditor', 'Auditoria e conformidade'),
	(4, 'estoque', 'Operador de estoque');

INSERT IGNORE INTO permissions (id, code, description) VALUES
	(1, 'view_dashboard', 'Ver dashboard'),
	(2, 'view_items', 'Ver itens'),
	(3, 'create_item', 'Cadastrar item'),
	(4, 'update_item', 'Editar item'),
	(5, 'withdraw_item', 'Retirar item'),
	(6, 'audit_log', 'Ver auditoria'),
	(7, 'manage_users', 'Gerenciar usuarios'),
	(8, 'delete_item', 'Inativar item'),
	(9, 'manage_categories', 'Gerenciar categorias'),
	(10, 'manage_sectors', 'Gerenciar setores');

INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES
	(1, 1),(1, 2),(1, 3),(1, 4),(1, 5),(1, 6),(1, 7),(1, 8),(1, 9),(1, 10),
	(2, 1),(2, 2),(2, 5),
	(3, 1),(3, 2),(3, 6),
	(4, 1),(4, 2),(4, 3),(4, 4),(4, 5),(4, 8),(4, 9),(4, 10);

-- Usuario admin inicial (senha: admin). Trocar na primeira execucao.
INSERT IGNORE INTO users (id, username, display_name, email, password_hash, role_id, active)
VALUES (1, 'admin', 'Admin', 'admin@local', 'admin', 1, 1);

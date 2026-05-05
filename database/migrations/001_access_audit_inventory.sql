CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  description VARCHAR(255) NULL,
  deleted_at DATETIME NULL,
  deleted_by INT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE users
  ADD COLUMN first_access_pending TINYINT(1) NOT NULL DEFAULT 0 AFTER active,
  ADD COLUMN last_login_at DATETIME NULL AFTER first_access_pending,
  ADD COLUMN deleted_at DATETIME NULL AFTER last_login_at;

ALTER TABLE items
  ADD COLUMN category_id INT NULL AFTER id,
  ADD COLUMN serial_number VARCHAR(120) NULL AFTER sku,
  ADD COLUMN responsible_name VARCHAR(160) NULL AFTER description,
  ADD COLUMN item_status VARCHAR(32) NOT NULL DEFAULT 'em_estoque' AFTER responsible_name,
  ADD COLUMN location_name VARCHAR(160) NULL AFTER item_status,
  ADD COLUMN supplier_name VARCHAR(160) NULL AFTER location_name,
  ADD COLUMN invoice_number VARCHAR(64) NULL AFTER supplier_name,
  ADD COLUMN purchase_date DATE NULL AFTER invoice_number,
  ADD COLUMN purchase_value DECIMAL(12,2) NULL AFTER purchase_date,
  ADD COLUMN deleted_at DATETIME NULL AFTER updated_at,
  ADD COLUMN deleted_by INT NULL AFTER deleted_at;

ALTER TABLE sectors
  ADD COLUMN deleted_at DATETIME NULL,
  ADD COLUMN deleted_by INT NULL;

INSERT IGNORE INTO categories (name)
SELECT DISTINCT TRIM(category)
FROM items
WHERE TRIM(category) <> '';

UPDATE items i
INNER JOIN categories c ON c.name = i.category
SET i.category_id = c.id
WHERE i.category_id IS NULL;

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

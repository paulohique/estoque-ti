ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL,
  ADD COLUMN IF NOT EXISTS deleted_by INT NULL AFTER deleted_at;

INSERT IGNORE INTO permissions (code, description) VALUES
  ('delete_item', 'Inativar item'),
  ('manage_categories', 'Gerenciar categorias'),
  ('manage_sectors', 'Gerenciar setores');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
INNER JOIN permissions p ON p.code = 'delete_item'
WHERE r.name IN ('admin', 'estoque');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
INNER JOIN permissions p ON p.code = 'manage_categories'
WHERE r.name IN ('admin', 'estoque');

INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
INNER JOIN permissions p ON p.code = 'manage_sectors'
WHERE r.name IN ('admin', 'estoque');

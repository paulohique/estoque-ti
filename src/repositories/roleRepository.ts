import { query } from "../lib/mysql";

type RolePermRow = {
  code: string;
};

export async function getRolePermissions(roleId: number): Promise<string[]> {
  const rows = await query<RolePermRow[]>(
    "SELECT p.code FROM role_permissions rp INNER JOIN permissions p ON p.id = rp.permission_id WHERE rp.role_id = ?",
    [roleId],
  );
  return rows.map((row) => row.code);
}

export async function listRoles() {
  return query<Array<{ id: number; name: string; description: string | null }>>(
    "SELECT id, name, description FROM roles ORDER BY id ASC",
  );
}

export async function replaceRolePermissions(roleId: number, permissionCodes: string[]) {
  await query("DELETE FROM role_permissions WHERE role_id = ?", [roleId]);

  for (const code of permissionCodes) {
    const permissionRows = await query<Array<{ id: number }>>(
      "SELECT id FROM permissions WHERE code = ? LIMIT 1",
      [code],
    );

    const permissionId = permissionRows[0]?.id;
    if (!permissionId) {
      continue;
    }

    await query(
      "INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)",
      [roleId, permissionId],
    );
  }
}

import { query } from "../lib/mysql";

type UserPermRow = {
  id?: number;
  code: string;
  description?: string | null;
  allowed: number;
};

export async function getUserPermissionOverrides(
  userId: number,
): Promise<Array<{ code: string; allowed: boolean }>> {
  const rows = await query<UserPermRow[]>(
    "SELECT p.code, up.allowed FROM user_permissions up INNER JOIN permissions p ON p.id = up.permission_id WHERE up.user_id = ?",
    [userId],
  );
  return rows.map((row) => ({ code: row.code, allowed: row.allowed === 1 }));
}

export async function listPermissions() {
  const rows = await query<Array<{ id: number; code: string; description: string | null }>>(
    "SELECT id, code, description FROM permissions ORDER BY id ASC",
  );

  return rows;
}

export async function replaceUserPermissionOverrides(
  userId: number,
  overrides: Array<{ code: string; allowed: boolean }>,
) {
  await query("DELETE FROM user_permissions WHERE user_id = ?", [userId]);

  for (const override of overrides) {
    const permissionRows = await query<Array<{ id: number }>>(
      "SELECT id FROM permissions WHERE code = ? LIMIT 1",
      [override.code],
    );

    const permissionId = permissionRows[0]?.id;
    if (!permissionId) {
      continue;
    }

    await query(
      "INSERT INTO user_permissions (user_id, permission_id, allowed) VALUES (?, ?, ?)",
      [userId, permissionId, override.allowed ? 1 : 0],
    );
  }
}

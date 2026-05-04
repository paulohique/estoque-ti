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

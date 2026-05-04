import { query } from "../lib/mysql";

type UserPermRow = {
  code: string;
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

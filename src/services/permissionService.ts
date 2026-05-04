import { getRolePermissions } from "../repositories/roleRepository";
import { getUserPermissionOverrides } from "../repositories/permissionRepository";

export async function getEffectivePermissions(userId: number, roleId: number) {
  const base = await getRolePermissions(roleId);
  const overrides = await getUserPermissionOverrides(userId);

  const result = new Set(base);
  for (const override of overrides) {
    if (override.allowed) {
      result.add(override.code);
    } else {
      result.delete(override.code);
    }
  }

  return Array.from(result);
}

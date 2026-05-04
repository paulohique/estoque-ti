import { permissions } from "../config/permissions";
import { getRolePermissions } from "../repositories/roleRepository";
import { getUserPermissionOverrides } from "../repositories/permissionRepository";
import { getUserById } from "../repositories/userRepository";

export async function getEffectivePermissions(userId: number, roleId: number) {
  const user = await getUserById(userId);
  if (!user) {
    return [];
  }

  if (user.firstAccessPending) {
    return [permissions.viewDashboard];
  }

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

import { permissions } from "../config/permissions";
import {
  getUserPermissionOverrides,
  listPermissions,
  replaceUserPermissionOverrides,
} from "../repositories/permissionRepository";
import { getRolePermissions, listRoles, replaceRolePermissions } from "../repositories/roleRepository";
import { listUsers, updateUserAccess } from "../repositories/userRepository";
import { getEffectivePermissions } from "./permissionService";

export async function getAccessManagementData() {
  const [users, roles, permissionList] = await Promise.all([
    listUsers(),
    listRoles(),
    listPermissions(),
  ]);

  const usersWithPermissions = await Promise.all(
    users.map(async (user) => ({
      ...user,
      overrides: await getUserPermissionOverrides(user.id),
      effectivePermissions: await getEffectivePermissions(user.id, user.roleId),
    })),
  );

  const rolesWithPermissions = await Promise.all(
    roles.map(async (role) => ({
      ...role,
      permissions: await getRolePermissions(role.id),
    })),
  );

  return {
    users: usersWithPermissions,
    roles: rolesWithPermissions,
    permissions: permissionList,
  };
}

export async function updateManagedUser(input: {
  id: number;
  roleId: number;
  active: boolean;
  firstAccessPending: boolean;
  overrides: Array<{ code: string; allowed: boolean }>;
}) {
  const user = await updateUserAccess({
    id: input.id,
    roleId: input.roleId,
    active: input.active,
    firstAccessPending: input.firstAccessPending,
  });

  const sanitizedOverrides = input.firstAccessPending
    ? []
    : input.overrides.filter((override) => override.code !== permissions.viewDashboard);

  await replaceUserPermissionOverrides(user.id, sanitizedOverrides);

  return {
    ...user,
    effectivePermissions: await getEffectivePermissions(user.id, user.roleId),
  };
}

export async function findRoleByName(name: string) {
  const roles = await listRoles();
  return roles.find((role) => role.name === name) ?? null;
}

export async function updateRolePermissionSet(input: {
  roleId: number;
  permissionCodes: string[];
}) {
  const permissionCodes = Array.from(
    new Set([permissions.viewDashboard, ...input.permissionCodes]),
  );

  await replaceRolePermissions(input.roleId, permissionCodes);

  const roles = await listRoles();
  const role = roles.find((item) => item.id === input.roleId);
  if (!role) {
    throw new Error("Role not found");
  }

  return {
    ...role,
    permissions: permissionCodes,
  };
}

import {
  getAccessManagementData,
  updateManagedUser,
  updateRolePermissionSet,
} from "../services/userAccessService";

export async function accessManagementController() {
  const data = await getAccessManagementData();
  return { ok: true, ...data };
}

export async function updateManagedUserController(input: {
  id: number;
  roleId: number;
  active: boolean;
  firstAccessPending: boolean;
  overrides: Array<{ code: string; allowed: boolean }>;
}) {
  const user = await updateManagedUser(input);
  return { ok: true, user };
}

export async function updateRolePermissionsController(input: {
  roleId: number;
  permissionCodes: string[];
}) {
  const role = await updateRolePermissionSet(input);
  return { ok: true, role };
}

import { NextResponse } from "next/server";

import {
  accessManagementController,
  updateManagedUserController,
  updateRolePermissionsController,
} from "../../../controllers/userAccessController";
import { getRequestIp, getRequestPath } from "../../../lib/request";
import { requirePermission } from "../../../lib/auth";
import { getUserPermissionOverrides } from "../../../repositories/permissionRepository";
import { getRolePermissions } from "../../../repositories/roleRepository";
import { getUserById } from "../../../repositories/userRepository";
import { recordAuditLog } from "../../../services/auditService";

export async function GET() {
  try {
    await requirePermission("manage_users");
    const result = await accessManagementController();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requirePermission("manage_users");
    const body = await request.json();
    const targetUserId = Number(body.id);
    const beforeUser = await getUserById(targetUserId);
    const beforeOverrides = await getUserPermissionOverrides(targetUserId);
    const result = await updateManagedUserController({
      id: targetUserId,
      roleId: Number(body.roleId),
      active: body.active === true,
      firstAccessPending: body.firstAccessPending === true,
      overrides: Array.isArray(body.overrides) ? body.overrides : [],
    });

    await recordAuditLog({
      entityType: "user_access",
      entityId: targetUserId,
      action: "update",
      actorUserId: session.userId,
      ipAddress: getRequestIp(request),
      routePath: getRequestPath(request),
      beforeData: beforeUser
        ? {
            ...beforeUser,
            overrides: beforeOverrides,
          }
        : null,
      afterData: result.user,
      metadata: {
        overrides: body.overrides ?? [],
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requirePermission("manage_users");
    const body = await request.json();
    const roleId = Number(body.roleId);
    const beforePermissions = await getRolePermissions(roleId);
    const result = await updateRolePermissionsController({
      roleId,
      permissionCodes: Array.isArray(body.permissionCodes) ? body.permissionCodes : [],
    });

    await recordAuditLog({
      entityType: "role_permissions",
      entityId: roleId,
      action: "update",
      actorUserId: session.userId,
      ipAddress: getRequestIp(request),
      routePath: getRequestPath(request),
      beforeData: {
        permissions: beforePermissions,
      },
      afterData: result.role,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

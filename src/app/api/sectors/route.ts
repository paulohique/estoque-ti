import { NextResponse } from "next/server";

import {
  createSectorController,
  deleteSectorController,
  listSectorsController,
  updateSectorController,
} from "../../../controllers/sectorController";
import { requireAnyPermission, requirePermission } from "../../../lib/auth";
import { getRequestIp, getRequestPath } from "../../../lib/request";
import { getSectorById } from "../../../repositories/sectorRepository";
import { recordAuditLog } from "../../../services/auditService";

export async function GET() {
  try {
    await requireAnyPermission(["view_items", "withdraw_item", "manage_sectors"]);
    const result = await listSectorsController();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const session = await requirePermission("manage_sectors");
    const body = await request.json();
    const result = await createSectorController({
      name: String(body.name ?? ""),
      description: body.description ? String(body.description) : null,
    });
    await recordAuditLog({
      entityType: "sector",
      entityId: result.sector.id,
      action: "create",
      actorUserId: session.userId,
      ipAddress: getRequestIp(request),
      routePath: getRequestPath(request),
      afterData: result.sector,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await requirePermission("manage_sectors");
    const body = await request.json();
    const beforeSector = await getSectorById(Number(body.id));
    const result = await updateSectorController({
      id: Number(body.id),
      name: String(body.name ?? ""),
      description: body.description ? String(body.description) : null,
    });
    await recordAuditLog({
      entityType: "sector",
      entityId: result.sector.id,
      action: "update",
      actorUserId: session.userId,
      ipAddress: getRequestIp(request),
      routePath: getRequestPath(request),
      beforeData: beforeSector,
      afterData: result.sector,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await requirePermission("manage_sectors");
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));
    const beforeSector = await getSectorById(id);
    const result = await deleteSectorController({ id, deletedBy: session.userId });
    await recordAuditLog({
      entityType: "sector",
      entityId: id,
      action: "soft_delete",
      actorUserId: session.userId,
      ipAddress: getRequestIp(request),
      routePath: getRequestPath(request),
      beforeData: beforeSector,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

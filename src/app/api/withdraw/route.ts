import { NextResponse } from "next/server";

import { withdrawController } from "../../../controllers/withdrawController";
import { requirePermission } from "../../../lib/auth";
import { getRequestIp, getRequestPath } from "../../../lib/request";
import { getItemById } from "../../../repositories/itemRepository";
import { recordAuditLog } from "../../../services/auditService";

export async function POST(request: Request) {
  try {
    const session = await requirePermission("withdraw_item");
    const body = await request.json();
    const beforeItem = await getItemById(Number(body.itemId));
    const result = await withdrawController({
      itemId: Number(body.itemId),
      quantity: Number(body.quantity),
      requestedBy: session.userId,
      movementType: body.movementType ?? "out",
      sectorId: body.sectorId ? Number(body.sectorId) : null,
      glpiTicketNumber: body.glpiTicketNumber ?? null,
      notes: body.notes ?? null,
      confirmed: body.confirmed === true,
    });

    await recordAuditLog({
      entityType: "stock_movement",
      entityId: result.movement.id,
      action: result.movement.movementType,
      actorUserId: session.userId,
      ipAddress: getRequestIp(request),
      routePath: getRequestPath(request),
      beforeData: beforeItem,
      afterData: result.item,
      metadata: {
        movement: result.movement,
        glpiCommentStatus: result.glpiCommentStatus,
        glpiError: result.glpiError,
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

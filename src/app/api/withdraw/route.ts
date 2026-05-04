import { NextResponse } from "next/server";

import { withdrawController } from "../../../controllers/withdrawController";
import { requirePermission } from "../../../lib/auth";

export async function POST(request: Request) {
  try {
    const session = await requirePermission("withdraw_item");
  const body = await request.json();
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

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

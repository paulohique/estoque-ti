import { NextResponse } from "next/server";

import { withdrawController } from "../../../controllers/withdrawController";

export async function POST(request: Request) {
  const body = await request.json();
  const result = await withdrawController({
    itemId: body.itemId,
    quantity: body.quantity,
    requestedBy: body.requestedBy,
    sectorId: body.sectorId ?? null,
    glpiTicketNumber: body.glpiTicketNumber,
    notes: body.notes ?? null,
    confirmed: body.confirmed === true,
  });

  return NextResponse.json(result, { status: 201 });
}

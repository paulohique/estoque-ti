import { NextResponse } from "next/server";

import { createItemController, listItemsController } from "../../../controllers/itemController";

export async function GET() {
  const result = await listItemsController();
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const body = await request.json();
  const result = await createItemController(body);
  return NextResponse.json(result, { status: 201 });
}

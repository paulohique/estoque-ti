import { NextResponse } from "next/server";

import { getHealth } from "../../../controllers/healthController";

export async function GET() {
  const payload = await getHealth();
  return NextResponse.json(payload);
}

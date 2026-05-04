import { NextResponse } from "next/server";

import { dashboardController } from "../../../controllers/dashboardController";
import { requirePermission } from "../../../lib/auth";

export async function GET() {
  try {
    await requirePermission("view_dashboard");
    const result = await dashboardController();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

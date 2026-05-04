import { NextResponse } from "next/server";

import { dashboardController } from "../../../controllers/dashboardController";
import { requirePermission } from "../../../lib/auth";

export async function GET(request: Request) {
  try {
    await requirePermission("view_dashboard");
    const url = new URL(request.url);
    const result = await dashboardController({
      dateFrom: url.searchParams.get("dateFrom"),
      dateTo: url.searchParams.get("dateTo"),
      sectorId: url.searchParams.get("sectorId") ? Number(url.searchParams.get("sectorId")) : null,
      categoryId: url.searchParams.get("categoryId") ? Number(url.searchParams.get("categoryId")) : null,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

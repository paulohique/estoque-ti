import { NextResponse } from "next/server";

import { listAuditLogsController } from "../../../controllers/auditController";
import { requirePermission } from "../../../lib/auth";

export async function GET(request: Request) {
  try {
    await requirePermission("audit_log");
    const limit = Number(new URL(request.url).searchParams.get("limit") ?? 100);
    const result = await listAuditLogsController(limit);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

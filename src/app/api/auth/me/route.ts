import { NextResponse } from "next/server";

import { meController } from "../../../../controllers/authController";
import { getSession } from "../../../../lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const result = await meController({ userId: session.userId, roleId: session.roleId });
  return NextResponse.json(result, { status: result.ok ? 200 : 404 });
}

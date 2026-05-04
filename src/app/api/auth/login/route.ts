import { NextResponse } from "next/server";

import { loginController } from "../../../../controllers/authController";
import {
  createSessionToken,
  getSessionCookieOptions,
  SESSION_COOKIE_NAME,
} from "../../../../lib/session";

export async function POST(request: Request) {
  const body = await request.json();
  const result = await loginController({
    username: body.username,
    password: body.password,
  });

  if (!result.ok || !result.user) {
    return NextResponse.json(result, { status: 401 });
  }

  const token = await createSessionToken({
    userId: result.user.id,
    roleId: result.user.roleId,
  });

  const response = NextResponse.json(result, { status: 200 });
  response.cookies.set(SESSION_COOKIE_NAME, token, getSessionCookieOptions());
  return response;
}

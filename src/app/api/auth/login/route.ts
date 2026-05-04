import { NextResponse } from "next/server";

import { loginController } from "../../../../controllers/authController";

export async function POST(request: Request) {
  const body = await request.json();
  const result = await loginController({
    username: body.username,
    password: body.password,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 401 });
}

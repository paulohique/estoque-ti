import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE_NAME = "session";

const secretValue = process.env.JWT_SECRET ?? "change-me";
const secret = new TextEncoder().encode(secretValue);
const expiresIn = process.env.JWT_EXPIRES_IN ?? "8h";
const issuer = "estoque-ti";

export type SessionPayload = {
  userId: number;
  roleId: number;
};

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(issuer)
    .setExpirationTime(expiresIn)
    .sign(secret);
}

export async function verifySessionToken(token: string) {
  const { payload } = await jwtVerify(token, secret, {
    issuer,
  });
  return payload as SessionPayload;
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

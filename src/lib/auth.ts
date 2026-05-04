import { cookies } from "next/headers";

import { getEffectivePermissions } from "../services/permissionService";
import { SESSION_COOKIE_NAME, verifySessionToken } from "./session";

export async function getSession() {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }
  try {
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requirePermission(code: string) {
  const session = await requireSession();
  const permissions = await getEffectivePermissions(session.userId, session.roleId);

  if (!permissions.includes(code)) {
    throw new Error("Forbidden");
  }

  return session;
}

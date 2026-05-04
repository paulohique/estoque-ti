import type { User } from "../models/User";
import { getUserById, getUserByUsername } from "../repositories/userRepository";
import { getEffectivePermissions } from "./permissionService";

async function adAuthenticate(_username: string, _password: string) {
  // Integracao com AD/LDAP.
  return true;
}

function shouldUseAd() {
  return (process.env.AD_ENABLED ?? "false").toLowerCase() === "true";
}

export async function login(username: string, password: string) {
  const forceLocal = username.startsWith(".\\");
  const normalizedUsername = forceLocal ? username.slice(2) : username;
  const useAd = shouldUseAd() && !forceLocal;
  if (useAd) {
    const ok = await adAuthenticate(normalizedUsername, password);
    if (!ok) {
      return null;
    }
  }

  const user = await getUserByUsername(normalizedUsername);
  if (!user) {
    return null;
  }

  if (!useAd) {
    if (!user.active || user.passwordHash !== password) {
      return null;
    }
  }

  const permissions = await getEffectivePermissions(user.id, user.roleId);
  return { user, permissions };
}

export async function getUserSession(userId: number, roleId: number) {
  const user = await getUserById(userId);
  if (!user) {
    return null;
  }
  const permissions = await getEffectivePermissions(userId, roleId ?? user.roleId);
  return { user, permissions };
}

export function sanitizeUser(user: User) {
  const { passwordHash: _passwordHash, ...rest } = user as User & { passwordHash?: string };
  return rest;
}

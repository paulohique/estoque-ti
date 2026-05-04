import type { User } from "../models/User";
import { getUserByUsername } from "../repositories/userRepository";
import { getEffectivePermissions } from "./permissionService";

async function adAuthenticate(_username: string, _password: string) {
  // Integracao com AD/LDAP.
  return true;
}

function shouldUseAd() {
  return (process.env.AD_ENABLED ?? "false").toLowerCase() === "true";
}

export async function login(username: string, password: string) {
  const useAd = shouldUseAd();
  if (useAd) {
    const ok = await adAuthenticate(username, password);
    if (!ok) {
      return null;
    }
  }

  const user = await getUserByUsername(username);
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

export function sanitizeUser(user: User) {
  const { passwordHash: _passwordHash, ...rest } = user as User & { passwordHash?: string };
  return rest;
}

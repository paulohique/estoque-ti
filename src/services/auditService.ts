import type { AuditLog } from "../models/AuditLog";
import { createAuditLog, listAuditLogs } from "../repositories/auditRepository";
import { getUserById } from "../repositories/userRepository";

export async function recordAuditLog(log: AuditLog) {
  if (!log.actorUsername && log.actorUserId) {
    const actor = await getUserById(log.actorUserId);
    if (actor) {
      log.actorUsername = actor.displayName || actor.username;
    }
  }

  return createAuditLog(log);
}

export async function getAuditLogs(limit?: number) {
  return listAuditLogs(limit);
}

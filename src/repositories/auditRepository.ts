import type { ResultSetHeader } from "mysql2";

import type { AuditLog } from "../models/AuditLog";
import { query } from "../lib/mysql";

type AuditLogRow = {
  id: number;
  entity_type: string;
  entity_id: number | null;
  action: string;
  actor_user_id: number | null;
  actor_username: string | null;
  ip_address: string | null;
  route_path: string | null;
  before_data: string | null;
  after_data: string | null;
  metadata_json: string | null;
  created_at: string;
};

function parseJson(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function mapAuditLog(row: AuditLogRow): AuditLog {
  return {
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    action: row.action,
    actorUserId: row.actor_user_id,
    actorUsername: row.actor_username,
    ipAddress: row.ip_address,
    routePath: row.route_path,
    beforeData: parseJson(row.before_data),
    afterData: parseJson(row.after_data),
    metadata: parseJson(row.metadata_json),
    createdAt: row.created_at,
  };
}

export async function createAuditLog(log: AuditLog) {
  const result = await query<ResultSetHeader>(
    `INSERT INTO audit_logs (
      entity_type,
      entity_id,
      action,
      actor_user_id,
      actor_username,
      ip_address,
      route_path,
      before_data,
      after_data,
      metadata_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      log.entityType,
      log.entityId ?? null,
      log.action,
      log.actorUserId ?? null,
      log.actorUsername ?? null,
      log.ipAddress ?? null,
      log.routePath ?? null,
      log.beforeData ? JSON.stringify(log.beforeData) : null,
      log.afterData ? JSON.stringify(log.afterData) : null,
      log.metadata ? JSON.stringify(log.metadata) : null,
    ],
  );

  return result.insertId;
}

export async function listAuditLogs(limit = 100) {
  const rows = await query<AuditLogRow[]>(
    "SELECT * FROM audit_logs ORDER BY created_at DESC, id DESC LIMIT ?",
    [limit],
  );

  return rows.map(mapAuditLog);
}

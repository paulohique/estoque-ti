import { getAuditLogs } from "../services/auditService";

export async function listAuditLogsController(limit?: number) {
  const logs = await getAuditLogs(limit);
  return { ok: true, logs };
}

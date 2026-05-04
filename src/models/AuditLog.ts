export interface AuditLog {
  id?: number;
  entityType: string;
  entityId?: number | null;
  action: string;
  actorUserId?: number | null;
  actorUsername?: string | null;
  ipAddress?: string | null;
  routePath?: string | null;
  beforeData?: unknown;
  afterData?: unknown;
  metadata?: unknown;
  createdAt?: string;
}

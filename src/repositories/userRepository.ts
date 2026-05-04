import type { User } from "../models/User";
import { query } from "../lib/mysql";

type UserRow = {
  id: number;
  username: string;
  display_name: string;
  email: string | null;
  password_hash: string | null;
  role_id: number;
  role_name?: string | null;
  active: number;
  first_access_pending: number;
  last_login_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    email: row.email,
    passwordHash: row.password_hash,
    roleId: row.role_id,
    roleName: row.role_name ?? null,
    active: row.active === 1,
    firstAccessPending: row.first_access_pending === 1,
    lastLoginAt: row.last_login_at,
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const baseUserSelect = `SELECT
  u.*,
  r.name AS role_name
FROM users u
INNER JOIN roles r ON r.id = u.role_id`;

export async function getUserById(id: number): Promise<User | null> {
  const rows = await query<UserRow[]>(
    `${baseUserSelect} WHERE u.id = ? AND u.deleted_at IS NULL LIMIT 1`,
    [id],
  );
  if (!rows.length) {
    return null;
  }
  return mapUser(rows[0]);
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const rows = await query<UserRow[]>(
    `${baseUserSelect} WHERE u.username = ? AND u.deleted_at IS NULL LIMIT 1`,
    [username],
  );
  if (!rows.length) {
    return null;
  }
  return mapUser(rows[0]);
}

export async function createUser(user: User): Promise<User> {
  const result = await query<{ insertId: number }>(
    "INSERT INTO users (username, display_name, email, password_hash, role_id, active, first_access_pending) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      user.username,
      user.displayName,
      user.email ?? null,
      user.passwordHash ?? null,
      user.roleId,
      user.active ? 1 : 0,
      user.firstAccessPending === false ? 0 : 1,
    ],
  );
  const created = await getUserById(result.insertId);
  if (!created) {
    throw new Error("Failed to create user");
  }
  return created;
}

export async function listUsers(): Promise<User[]> {
  const rows = await query<UserRow[]>(
    `${baseUserSelect} WHERE u.deleted_at IS NULL ORDER BY u.display_name ASC, u.username ASC`,
  );

  return rows.map(mapUser);
}

export async function updateUserAccess(input: {
  id: number;
  roleId: number;
  active: boolean;
  firstAccessPending: boolean;
}) {
  await query(
    "UPDATE users SET role_id = ?, active = ?, first_access_pending = ? WHERE id = ? AND deleted_at IS NULL",
    [input.roleId, input.active ? 1 : 0, input.firstAccessPending ? 1 : 0, input.id],
  );

  const updated = await getUserById(input.id);
  if (!updated) {
    throw new Error("User not found");
  }

  return updated;
}

export async function updateUserLastLogin(id: number) {
  await query(
    "UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL",
    [id],
  );
}

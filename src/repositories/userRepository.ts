import type { User } from "../models/User";
import { query } from "../lib/mysql";

type UserRow = {
  id: number;
  username: string;
  display_name: string;
  email: string | null;
  password_hash: string | null;
  role_id: number;
  active: number;
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
    active: row.active === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getUserById(id: number): Promise<User | null> {
  const rows = await query<UserRow[]>(
    "SELECT * FROM users WHERE id = ? LIMIT 1",
    [id],
  );
  if (!rows.length) {
    return null;
  }
  return mapUser(rows[0]);
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const rows = await query<UserRow[]>(
    "SELECT * FROM users WHERE username = ? LIMIT 1",
    [username],
  );
  if (!rows.length) {
    return null;
  }
  return mapUser(rows[0]);
}

export async function createUser(user: User): Promise<User> {
  const result = await query<{ insertId: number }>(
    "INSERT INTO users (username, display_name, email, password_hash, role_id, active) VALUES (?, ?, ?, ?, ?, ?)",
    [
      user.username,
      user.displayName,
      user.email ?? null,
      user.passwordHash ?? null,
      user.roleId,
      user.active ? 1 : 0,
    ],
  );
  const created = await getUserById(result.insertId);
  if (!created) {
    throw new Error("Failed to create user");
  }
  return created;
}

import mysql from "mysql2/promise";

import { getDbConfig } from "./db";

const config = getDbConfig();

export const pool = mysql.createPool({
  host: config.host,
  port: config.port,
  user: config.user,
  password: config.password,
  database: config.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function query<T = unknown>(sql: string, params: unknown[] = []) {
  const [rows] = await pool.query(sql, params);
  return rows as T;
}

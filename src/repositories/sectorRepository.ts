import type { Sector } from "../models/Sector";
import type { ResultSetHeader } from "mysql2";

import { query } from "../lib/mysql";

export async function listSectors(): Promise<Sector[]> {
  return query<Sector[]>("SELECT id, name, description FROM sectors WHERE deleted_at IS NULL ORDER BY name ASC");
}

export async function getSectorById(id: number): Promise<Sector | null> {
  const rows = await query<Sector[]>(
    "SELECT id, name, description FROM sectors WHERE id = ? AND deleted_at IS NULL LIMIT 1",
    [id],
  );

  return rows[0] ?? null;
}

export async function createSector(input: Omit<Sector, "id">): Promise<Sector> {
  const result = await query<ResultSetHeader>(
    "INSERT INTO sectors (name, description) VALUES (?, ?)",
    [input.name, input.description ?? null],
  );

  const sector = await getSectorById(result.insertId);
  if (!sector) {
    throw new Error("Failed to create sector");
  }

  return sector;
}

export async function updateSector(input: Sector): Promise<Sector> {
  await query(
    "UPDATE sectors SET name = ?, description = ? WHERE id = ?",
    [input.name, input.description ?? null, input.id],
  );

  const sector = await getSectorById(input.id);
  if (!sector) {
    throw new Error("Sector not found");
  }

  return sector;
}

export async function deleteSector(id: number, deletedBy?: number | null) {
  await query(
    "UPDATE sectors SET deleted_at = CURRENT_TIMESTAMP, deleted_by = ? WHERE id = ? AND deleted_at IS NULL",
    [deletedBy ?? null, id],
  );
}

export async function findSectorByNormalizedName(name: string) {
  const rows = await query<Sector[]>(
    "SELECT id, name, description FROM sectors WHERE deleted_at IS NULL AND LOWER(TRIM(name)) = LOWER(TRIM(?)) LIMIT 1",
    [name],
  );

  return rows[0] ?? null;
}

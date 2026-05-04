import type { ResultSetHeader } from "mysql2";

import type { Category } from "../models/Category";
import { query } from "../lib/mysql";

export async function listCategories(): Promise<Category[]> {
  return query<Category[]>(
    "SELECT id, name, description FROM categories WHERE deleted_at IS NULL ORDER BY name ASC",
  );
}

export async function getCategoryById(id: number): Promise<Category | null> {
  const rows = await query<Category[]>(
    "SELECT id, name, description FROM categories WHERE id = ? AND deleted_at IS NULL LIMIT 1",
    [id],
  );

  return rows[0] ?? null;
}

export async function createCategory(input: Omit<Category, "id">): Promise<Category> {
  const result = await query<ResultSetHeader>(
    "INSERT INTO categories (name, description) VALUES (?, ?)",
    [input.name, input.description ?? null],
  );

  const category = await getCategoryById(result.insertId);
  if (!category) {
    throw new Error("Failed to create category");
  }

  return category;
}

export async function updateCategory(input: Category): Promise<Category> {
  await query(
    "UPDATE categories SET name = ?, description = ? WHERE id = ?",
    [input.name, input.description ?? null, input.id],
  );

  const category = await getCategoryById(input.id);
  if (!category) {
    throw new Error("Category not found");
  }

  return category;
}

export async function deleteCategory(id: number, deletedBy?: number | null) {
  await query(
    "UPDATE categories SET deleted_at = CURRENT_TIMESTAMP, deleted_by = ? WHERE id = ? AND deleted_at IS NULL",
    [deletedBy ?? null, id],
  );
}

export async function findCategoryByNormalizedName(name: string) {
  const rows = await query<Category[]>(
    "SELECT id, name, description FROM categories WHERE deleted_at IS NULL AND LOWER(TRIM(name)) = LOWER(TRIM(?)) LIMIT 1",
    [name],
  );

  return rows[0] ?? null;
}

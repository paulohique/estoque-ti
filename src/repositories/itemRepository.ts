import type { Item } from "../models/Item";
import type { ResultSetHeader } from "mysql2";

import { pool, query } from "../lib/mysql";

type ItemRow = {
  id: number;
  category_id: number | null;
  name: string;
  category: string;
  category_name: string | null;
  asset_tag: string | null;
  sku: string | null;
  description: string | null;
  image_path: string | null;
  qty_total: number;
  qty_min: number;
  created_at: string;
  updated_at: string;
};

function mapItem(row: ItemRow): Item {
  return {
    id: row.id,
    categoryId: row.category_id,
    name: row.name,
    category: row.category_name ?? row.category,
    assetTag: row.asset_tag,
    sku: row.sku,
    description: row.description,
    imagePath: row.image_path,
    qtyTotal: row.qty_total,
    qtyMin: row.qty_min,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listItems(): Promise<Item[]> {
  const rows = await query<ItemRow[]>(
    `SELECT
      i.*,
      c.name AS category_name
    FROM items i
    LEFT JOIN categories c ON c.id = i.category_id
    ORDER BY i.id DESC`,
  );
  return rows.map(mapItem);
}

export async function getItemById(id: number): Promise<Item | null> {
  const rows = await query<ItemRow[]>(
    `SELECT
      i.*,
      c.name AS category_name
    FROM items i
    LEFT JOIN categories c ON c.id = i.category_id
    WHERE i.id = ? LIMIT 1`,
    [id],
  );
  if (!rows.length) {
    return null;
  }
  return mapItem(rows[0]);
}

export async function createItem(item: Item): Promise<Item> {
  const result = await query<{ insertId: number }>(
    "INSERT INTO items (name, category_id, category, asset_tag, sku, description, image_path, qty_total, qty_min) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      item.name,
      item.categoryId ?? null,
      item.category,
      item.assetTag ?? null,
      item.sku ?? null,
      item.description ?? null,
      item.imagePath ?? null,
      item.qtyTotal,
      item.qtyMin,
    ],
  );
  const created = await getItemById(result.insertId);
  if (!created) {
    throw new Error("Failed to create item");
  }
  return created;
}

export async function updateItem(item: Item): Promise<Item> {
  if (!item.id) {
    throw new Error("Item id required");
  }
  await query(
    "UPDATE items SET name = ?, category_id = ?, category = ?, asset_tag = ?, sku = ?, description = ?, image_path = ?, qty_total = ?, qty_min = ? WHERE id = ?",
    [
      item.name,
      item.categoryId ?? null,
      item.category,
      item.assetTag ?? null,
      item.sku ?? null,
      item.description ?? null,
      item.imagePath ?? null,
      item.qtyTotal,
      item.qtyMin,
      item.id,
    ],
  );
  const updated = await getItemById(item.id);
  if (!updated) {
    throw new Error("Failed to update item");
  }
  return updated;
}

export async function updateItemQuantity(id: number, quantity: number): Promise<Item> {
  await query(
    "UPDATE items SET qty_total = ? WHERE id = ?",
    [quantity, id],
  );

  const updated = await getItemById(id);
  if (!updated) {
    throw new Error("Failed to update item quantity");
  }

  return updated;
}

export async function countItemsByCategoryId(categoryId: number) {
  const rows = await query<Array<{ count: number }>>(
    "SELECT COUNT(*) AS count FROM items WHERE category_id = ?",
    [categoryId],
  );

  return Number(rows[0]?.count ?? 0);
}

export async function deleteItemById(id: number) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [itemRows] = await connection.query<ItemRow[]>(
      "SELECT * FROM items WHERE id = ? LIMIT 1 FOR UPDATE",
      [id],
    );

    const itemRow = itemRows[0];
    if (!itemRow) {
      throw new Error("Item not found");
    }

    const [movementRows] = await connection.query<Array<{ count: number }>>(
      "SELECT COUNT(*) AS count FROM stock_movements WHERE item_id = ?",
      [id],
    );

    const [imageRows] = await connection.query<Array<{ count: number }>>(
      "SELECT COUNT(*) AS count FROM item_images WHERE item_id = ?",
      [id],
    );

    await connection.query(
      "DELETE FROM item_images WHERE item_id = ?",
      [id],
    );

    await connection.query(
      "DELETE FROM stock_movements WHERE item_id = ?",
      [id],
    );

    const [result] = await connection.query<ResultSetHeader>(
      "DELETE FROM items WHERE id = ?",
      [id],
    );

    if (result.affectedRows === 0) {
      throw new Error("Failed to delete item");
    }

    await connection.commit();

    return {
      item: mapItem(itemRow),
      relations: {
        movementCount: Number(movementRows[0]?.count ?? 0),
        imageCount: Number(imageRows[0]?.count ?? 0),
      },
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

import type { Item } from "../models/Item";
import { query } from "../lib/mysql";

type ItemRow = {
  id: number;
  name: string;
  category: string;
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
    name: row.name,
    category: row.category,
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
    "SELECT * FROM items ORDER BY id DESC",
  );
  return rows.map(mapItem);
}

export async function getItemById(id: number): Promise<Item | null> {
  const rows = await query<ItemRow[]>(
    "SELECT * FROM items WHERE id = ? LIMIT 1",
    [id],
  );
  if (!rows.length) {
    return null;
  }
  return mapItem(rows[0]);
}

export async function createItem(item: Item): Promise<Item> {
  const result = await query<{ insertId: number }>(
    "INSERT INTO items (name, category, asset_tag, sku, description, image_path, qty_total, qty_min) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [
      item.name,
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
    "UPDATE items SET name = ?, category = ?, asset_tag = ?, sku = ?, description = ?, image_path = ?, qty_total = ?, qty_min = ? WHERE id = ?",
    [
      item.name,
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

import type { Item } from "../models/Item";

import { query } from "../lib/mysql";

type ItemRow = {
  id: number;
  category_id: number | null;
  name: string;
  category: string;
  category_name: string | null;
  asset_tag: string | null;
  sku: string | null;
  serial_number: string | null;
  description: string | null;
  responsible_name: string | null;
  item_status: string | null;
  location_name: string | null;
  supplier_name: string | null;
  invoice_number: string | null;
  purchase_date: string | null;
  purchase_value: number | null;
  image_path: string | null;
  qty_total: number;
  qty_min: number;
  deleted_at: string | null;
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
    serialNumber: row.serial_number,
    description: row.description,
    responsibleName: row.responsible_name,
    itemStatus: row.item_status ?? "em_estoque",
    locationName: row.location_name,
    supplierName: row.supplier_name,
    invoiceNumber: row.invoice_number,
    purchaseDate: row.purchase_date,
    purchaseValue: row.purchase_value,
    imagePath: row.image_path,
    qtyTotal: row.qty_total,
    qtyMin: row.qty_min,
    deletedAt: row.deleted_at,
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
    WHERE i.deleted_at IS NULL
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
    WHERE i.id = ? AND i.deleted_at IS NULL LIMIT 1`,
    [id],
  );
  if (!rows.length) {
    return null;
  }
  return mapItem(rows[0]);
}

export async function createItem(item: Item): Promise<Item> {
  const result = await query<{ insertId: number }>(
    `INSERT INTO items (
      name, category_id, category, asset_tag, sku, serial_number, description,
      responsible_name, item_status, location_name, supplier_name, invoice_number,
      purchase_date, purchase_value, image_path, qty_total, qty_min
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      item.name,
      item.categoryId ?? null,
      item.category,
      item.assetTag ?? null,
      item.sku ?? null,
      item.serialNumber ?? null,
      item.description ?? null,
      item.responsibleName ?? null,
      item.itemStatus ?? "em_estoque",
      item.locationName ?? null,
      item.supplierName ?? null,
      item.invoiceNumber ?? null,
      item.purchaseDate ?? null,
      item.purchaseValue ?? null,
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
    `UPDATE items SET
      name = ?, category_id = ?, category = ?, asset_tag = ?, sku = ?, serial_number = ?,
      description = ?, responsible_name = ?, item_status = ?, location_name = ?,
      supplier_name = ?, invoice_number = ?, purchase_date = ?, purchase_value = ?,
      image_path = ?, qty_total = ?, qty_min = ?
    WHERE id = ? AND deleted_at IS NULL`,
    [
      item.name,
      item.categoryId ?? null,
      item.category,
      item.assetTag ?? null,
      item.sku ?? null,
      item.serialNumber ?? null,
      item.description ?? null,
      item.responsibleName ?? null,
      item.itemStatus ?? "em_estoque",
      item.locationName ?? null,
      item.supplierName ?? null,
      item.invoiceNumber ?? null,
      item.purchaseDate ?? null,
      item.purchaseValue ?? null,
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
    "UPDATE items SET qty_total = ? WHERE id = ? AND deleted_at IS NULL",
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
    "SELECT COUNT(*) AS count FROM items WHERE category_id = ? AND deleted_at IS NULL",
    [categoryId],
  );

  return Number(rows[0]?.count ?? 0);
}

export async function softDeleteItemById(id: number, deletedBy: number) {
  const existing = await getItemById(id);
  if (!existing) {
    throw new Error("Item not found");
  }

  const movementRows = await query<Array<{ count: number }>>(
    "SELECT COUNT(*) AS count FROM stock_movements WHERE item_id = ?",
    [id],
  );

  const imageRows = await query<Array<{ count: number }>>(
    "SELECT COUNT(*) AS count FROM item_images WHERE item_id = ?",
    [id],
  );

  await query(
    "UPDATE items SET deleted_at = CURRENT_TIMESTAMP, deleted_by = ? WHERE id = ? AND deleted_at IS NULL",
    [deletedBy, id],
  );

  return {
    item: existing,
    relations: {
      movementCount: Number(movementRows[0]?.count ?? 0),
      imageCount: Number(imageRows[0]?.count ?? 0),
    },
  };
}

export async function getActiveItemByAssetTag(assetTag: string) {
  const rows = await query<ItemRow[]>(
    `SELECT
      i.*,
      c.name AS category_name
    FROM items i
    LEFT JOIN categories c ON c.id = i.category_id
    WHERE i.asset_tag = ? AND i.deleted_at IS NULL
    LIMIT 1`,
    [assetTag],
  );

  return rows[0] ? mapItem(rows[0]) : null;
}

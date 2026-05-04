import type { StockMovement } from "../models/StockMovement";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

import type { Item } from "../models/Item";
import { pool, query } from "../lib/mysql";
import { getItemById } from "./itemRepository";

type ItemStockRow = RowDataPacket & {
  id: number;
  qty_total: number;
};

type RecentMovementRow = {
  id: number;
  item_id: number;
  item_name: string;
  movement_type: "in" | "out" | "transfer";
  quantity: number;
  requested_by_name: string;
  glpi_ticket_number: string | null;
  notes: string | null;
  created_at: string;
};

export type RecentMovement = {
  id: number;
  itemId: number;
  itemName: string;
  movementType: "in" | "out" | "transfer";
  quantity: number;
  requestedByName: string;
  glpiTicketNumber: string | null;
  notes: string | null;
  createdAt: string;
};

export async function createMovement(movement: StockMovement): Promise<StockMovement> {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.query<ItemStockRow[]>(
      "SELECT id, qty_total FROM items WHERE id = ? LIMIT 1 FOR UPDATE",
      [movement.itemId],
    );

    const itemRow = rows[0];
    if (!itemRow) {
      throw new Error("Item not found");
    }

    let nextQuantity = itemRow.qty_total;

    if (movement.movementType === "in") {
      nextQuantity += movement.quantity;
    } else if (movement.movementType === "out") {
      if (movement.quantity > itemRow.qty_total) {
        throw new Error("Insufficient stock");
      }
      nextQuantity -= movement.quantity;
    }

    if (movement.movementType !== "transfer") {
      await connection.query(
        "UPDATE items SET qty_total = ? WHERE id = ?",
        [nextQuantity, movement.itemId],
      );
    }

    const [result] = await connection.query<ResultSetHeader>(
      "INSERT INTO stock_movements (item_id, movement_type, quantity, requested_by, sector_id, glpi_ticket_number, glpi_comment_status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        movement.itemId,
        movement.movementType,
        movement.quantity,
        movement.requestedBy,
        movement.sectorId ?? null,
        movement.glpiTicketNumber ?? null,
        movement.glpiCommentStatus ?? null,
        movement.notes ?? null,
      ],
    );

    await connection.commit();

    return { ...movement, id: result.insertId };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function getRecentMovements(limit = 8): Promise<RecentMovement[]> {
  const rows = await query<RecentMovementRow[]>(
    `SELECT
      sm.id,
      sm.item_id,
      i.name AS item_name,
      sm.movement_type,
      sm.quantity,
      u.display_name AS requested_by_name,
      sm.glpi_ticket_number,
      sm.notes,
      sm.created_at
    FROM stock_movements sm
    INNER JOIN items i ON i.id = sm.item_id
    INNER JOIN users u ON u.id = sm.requested_by
    ORDER BY sm.created_at DESC, sm.id DESC
    LIMIT ?`,
    [limit],
  );

  return rows.map((row) => ({
    id: row.id,
    itemId: row.item_id,
    itemName: row.item_name,
    movementType: row.movement_type,
    quantity: row.quantity,
    requestedByName: row.requested_by_name,
    glpiTicketNumber: row.glpi_ticket_number,
    notes: row.notes,
    createdAt: row.created_at,
  }));
}

export async function getUpdatedItemFromMovement(movement: StockMovement): Promise<Item | null> {
  return getItemById(movement.itemId);
}

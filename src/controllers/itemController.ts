import type { Item } from "../models/Item";
import { addItem, getItems, removeItem, updateItem } from "../services/itemService";

export async function listItemsController() {
  const items = await getItems();
  return { ok: true, items };
}

export async function createItemController(item: Item) {
  const created = await addItem(item);
  return { ok: true, item: created };
}

export async function updateItemController(item: Item) {
  const updated = await updateItem(item);
  return { ok: true, item: updated };
}

export async function deleteItemController(input: { id: number }) {
  const deleted = await removeItem(input.id);
  return { ok: true, ...deleted };
}

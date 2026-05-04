import type { Item } from "../models/Item";
import { addItem, getItems } from "../services/itemService";

export async function listItemsController() {
  const items = await getItems();
  return { ok: true, items };
}

export async function createItemController(item: Item) {
  const created = await addItem(item);
  return { ok: true, item: created };
}

import type { Item } from "../models/Item";
import { createItem, listItems } from "../repositories/itemRepository";

export async function getItems() {
  return listItems();
}

export async function addItem(item: Item) {
  return createItem(item);
}

import type { Item } from "../models/Item";
import { createItem, listItems, updateItem as updateItemRepo } from "../repositories/itemRepository";

export async function getItems() {
  return listItems();
}

export async function addItem(item: Item) {
  if (!item.name.trim() || !item.category.trim()) {
    throw new Error("Name and category are required");
  }

  return createItem(item);
}

export async function updateItem(item: Item) {
  if (!item.id) {
    throw new Error("Item id required");
  }

  return updateItemRepo(item);
}

import type { Item } from "../models/Item";

export async function listItems(): Promise<Item[]> {
  // Implementar com MySQL.
  return [];
}

export async function getItemById(_id: number): Promise<Item | null> {
  // Implementar com MySQL.
  return null;
}

export async function createItem(item: Item): Promise<Item> {
  // Implementar com MySQL.
  return item;
}

export async function updateItem(item: Item): Promise<Item> {
  // Implementar com MySQL.
  return item;
}

import type { Item } from "../models/Item";
import { removeUpload } from "../lib/upload";
import { findCategoryById } from "./categoryService";
import { createItem, deleteItemById, listItems, updateItem as updateItemRepo } from "../repositories/itemRepository";

export async function getItems() {
  return listItems();
}

export async function addItem(item: Item) {
  if (!item.name.trim()) {
    throw new Error("Name is required");
  }

  if (!item.categoryId) {
    throw new Error("Category is required");
  }

  const category = await findCategoryById(item.categoryId);
  if (!category) {
    throw new Error("Category not found");
  }

  item.category = category.name;
  return createItem(item);
}

export async function updateItem(item: Item) {
  if (!item.id) {
    throw new Error("Item id required");
  }

  if (!item.categoryId) {
    throw new Error("Category is required");
  }

  const category = await findCategoryById(item.categoryId);
  if (!category) {
    throw new Error("Category not found");
  }

  item.category = category.name;
  return updateItemRepo(item);
}

export async function removeItem(id: number) {
  if (!id) {
    throw new Error("Item id required");
  }

  const deleted = await deleteItemById(id);
  await removeUpload(deleted.item.imagePath);
  return deleted;
}

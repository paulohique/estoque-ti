import type { Item } from "../models/Item";
import { findCategoryById } from "./categoryService";
import {
  createItem,
  getActiveItemByAssetTag,
  listItems,
  softDeleteItemById,
  updateItem as updateItemRepo,
} from "../repositories/itemRepository";

const validItemStatuses = new Set(["em_estoque", "em_uso", "manutencao", "baixado"]);

function validateItem(item: Item) {
  if (item.qtyTotal < 0 || item.qtyMin < 0) {
    throw new Error("Quantities cannot be negative");
  }

  if (!validItemStatuses.has(item.itemStatus ?? "em_estoque")) {
    throw new Error("Invalid item status");
  }

  if (item.purchaseValue != null && item.purchaseValue < 0) {
    throw new Error("Purchase value cannot be negative");
  }
}

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

  validateItem(item);

  if (item.assetTag?.trim()) {
    const existing = await getActiveItemByAssetTag(item.assetTag.trim());
    if (existing) {
      throw new Error("Asset tag is already linked to another active item");
    }
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

  validateItem(item);

  if (item.assetTag?.trim()) {
    const existing = await getActiveItemByAssetTag(item.assetTag.trim());
    if (existing && existing.id !== item.id) {
      throw new Error("Asset tag is already linked to another active item");
    }
  }

  item.category = category.name;
  return updateItemRepo(item);
}

export async function removeItem(id: number, deletedBy: number) {
  if (!id) {
    throw new Error("Item id required");
  }

  const deleted = await softDeleteItemById(id, deletedBy);
  return deleted;
}

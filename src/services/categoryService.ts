import type { Category } from "../models/Category";
import {
  createCategory,
  deleteCategory,
  getCategoryById,
  listCategories,
  updateCategory,
} from "../repositories/categoryRepository";
import { countItemsByCategoryId } from "../repositories/itemRepository";

export async function getCategories() {
  return listCategories();
}

export async function findCategoryById(id: number) {
  return getCategoryById(id);
}

export async function addCategory(input: { name: string; description?: string | null }) {
  const name = input.name.trim();
  if (!name) {
    throw new Error("Category name is required");
  }

  return createCategory({
    name,
    description: input.description?.trim() || null,
  });
}

export async function editCategory(input: Category) {
  const name = input.name.trim();
  if (!input.id) {
    throw new Error("Category id is required");
  }
  if (!name) {
    throw new Error("Category name is required");
  }

  return updateCategory({
    ...input,
    name,
    description: input.description?.trim() || null,
  });
}

export async function removeCategory(id: number) {
  const category = await getCategoryById(id);
  if (!category) {
    throw new Error("Category not found");
  }

  const linkedItems = await countItemsByCategoryId(id);
  if (linkedItems > 0) {
    throw new Error("This category is already linked to products and cannot be deleted");
  }

  try {
    await deleteCategory(id);
  } catch {
    throw new Error("This category is already linked to products and cannot be deleted");
  }
}

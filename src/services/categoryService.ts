import type { Category } from "../models/Category";
import {
  createCategory,
  deleteCategory,
  findCategoryByNormalizedName,
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

  const existing = await findCategoryByNormalizedName(name);
  if (existing) {
    throw new Error("A category with this name already exists");
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

  const existing = await findCategoryByNormalizedName(name);
  if (existing && existing.id !== input.id) {
    throw new Error("A category with this name already exists");
  }

  return updateCategory({
    ...input,
    name,
    description: input.description?.trim() || null,
  });
}

export async function removeCategory(id: number, deletedBy?: number) {
  const category = await getCategoryById(id);
  if (!category) {
    throw new Error("Category not found");
  }

  const linkedItems = await countItemsByCategoryId(id);
  if (linkedItems > 0) {
    throw new Error("This category is already linked to products and cannot be deleted");
  }

  try {
    await deleteCategory(id, deletedBy);
  } catch {
    throw new Error("This category is already linked to products and cannot be deleted");
  }
}

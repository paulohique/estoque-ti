import type { Category } from "../models/Category";
import {
  addCategory,
  editCategory,
  getCategories,
  removeCategory,
} from "../services/categoryService";

export async function listCategoriesController() {
  const categories = await getCategories();
  return { ok: true, categories };
}

export async function createCategoryController(input: { name: string; description?: string | null }) {
  const category = await addCategory(input);
  return { ok: true, category };
}

export async function updateCategoryController(input: Category) {
  const category = await editCategory(input);
  return { ok: true, category };
}

export async function deleteCategoryController(input: { id: number; deletedBy?: number }) {
  await removeCategory(input.id, input.deletedBy);
  return { ok: true };
}

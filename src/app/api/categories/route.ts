import { NextResponse } from "next/server";

import {
  createCategoryController,
  deleteCategoryController,
  listCategoriesController,
  updateCategoryController,
} from "../../../controllers/categoryController";
import { requirePermission } from "../../../lib/auth";

export async function GET() {
  try {
    await requirePermission("view_items");
    const result = await listCategoriesController();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    await requirePermission("update_item");
    const body = await request.json();
    const result = await createCategoryController({
      name: String(body.name ?? ""),
      description: body.description ? String(body.description) : null,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function PUT(request: Request) {
  try {
    await requirePermission("update_item");
    const body = await request.json();
    const result = await updateCategoryController({
      id: Number(body.id),
      name: String(body.name ?? ""),
      description: body.description ? String(body.description) : null,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function DELETE(request: Request) {
  try {
    await requirePermission("update_item");
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));
    const result = await deleteCategoryController({ id });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

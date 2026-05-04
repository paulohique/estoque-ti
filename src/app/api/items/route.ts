import { NextResponse } from "next/server";

import {
  createItemController,
  deleteItemController,
  listItemsController,
  updateItemController,
} from "../../../controllers/itemController";
import { requirePermission } from "../../../lib/auth";
import { saveUpload } from "../../../lib/upload";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requirePermission("view_items");
    const result = await listItemsController();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    await requirePermission("create_item");
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("image");
      let imagePath: string | null = null;

      if (file && typeof file !== "string" && file.size > 0) {
        const saved = await saveUpload(file);
        imagePath = saved.publicPath;
      }

      const result = await createItemController({
        name: String(form.get("name") ?? ""),
        categoryId: form.get("categoryId") ? Number(form.get("categoryId")) : null,
        category: String(form.get("category") ?? ""),
        assetTag: form.get("assetTag") ? String(form.get("assetTag")) : null,
        sku: form.get("sku") ? String(form.get("sku")) : null,
        description: form.get("description") ? String(form.get("description")) : null,
        imagePath,
        qtyTotal: Number(form.get("qtyTotal") ?? 0),
        qtyMin: Number(form.get("qtyMin") ?? 0),
      });
      return NextResponse.json(result, { status: 201 });
    }

    const body = await request.json();
    const result = await createItemController(body);
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
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("image");
      let imagePath = form.get("imagePath") ? String(form.get("imagePath")) : null;

      if (file && typeof file !== "string" && file.size > 0) {
        const saved = await saveUpload(file);
        imagePath = saved.publicPath;
      }

      const result = await updateItemController({
        id: Number(form.get("id")),
        name: String(form.get("name") ?? ""),
        categoryId: form.get("categoryId") ? Number(form.get("categoryId")) : null,
        category: String(form.get("category") ?? ""),
        assetTag: form.get("assetTag") ? String(form.get("assetTag")) : null,
        sku: form.get("sku") ? String(form.get("sku")) : null,
        description: form.get("description") ? String(form.get("description")) : null,
        imagePath,
        qtyTotal: Number(form.get("qtyTotal") ?? 0),
        qtyMin: Number(form.get("qtyMin") ?? 0),
      });
      return NextResponse.json(result);
    }

    const body = await request.json();
    const result = await updateItemController(body);
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
    const result = await deleteItemController({ id });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

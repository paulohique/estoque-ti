import { NextResponse } from "next/server";

import {
  createItemController,
  deleteItemController,
  listItemsController,
  updateItemController,
} from "../../../controllers/itemController";
import { requirePermission } from "../../../lib/auth";
import { getRequestIp, getRequestPath } from "../../../lib/request";
import { saveUpload } from "../../../lib/upload";
import { getItemById } from "../../../repositories/itemRepository";
import { recordAuditLog } from "../../../services/auditService";

export const runtime = "nodejs";

function normalizeDateInput(value: FormDataEntryValue | string | null | undefined) {
  if (!value) {
    return null;
  }

  const rawValue = String(value).trim();
  if (!rawValue) {
    return null;
  }

  return rawValue.length >= 10 ? rawValue.slice(0, 10) : rawValue;
}

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
    const session = await requirePermission("create_item");
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
        serialNumber: form.get("serialNumber") ? String(form.get("serialNumber")) : null,
        description: form.get("description") ? String(form.get("description")) : null,
        responsibleName: form.get("responsibleName") ? String(form.get("responsibleName")) : null,
        itemStatus: form.get("itemStatus") ? String(form.get("itemStatus")) : "em_estoque",
        locationName: form.get("locationName") ? String(form.get("locationName")) : null,
        supplierName: form.get("supplierName") ? String(form.get("supplierName")) : null,
        invoiceNumber: form.get("invoiceNumber") ? String(form.get("invoiceNumber")) : null,
        purchaseDate: normalizeDateInput(form.get("purchaseDate")),
        purchaseValue: form.get("purchaseValue") ? Number(form.get("purchaseValue")) : null,
        imagePath,
        qtyTotal: Number(form.get("qtyTotal") ?? 0),
        qtyMin: Number(form.get("qtyMin") ?? 0),
      });
      await recordAuditLog({
        entityType: "item",
        entityId: result.item.id ?? null,
        action: "create",
        actorUserId: session.userId,
        ipAddress: getRequestIp(request),
        routePath: getRequestPath(request),
        afterData: result.item,
      });
      return NextResponse.json(result, { status: 201 });
    }

    const body = await request.json();
    const result = await createItemController(body);
    await recordAuditLog({
      entityType: "item",
      entityId: result.item.id ?? null,
      action: "create",
      actorUserId: session.userId,
      ipAddress: getRequestIp(request),
      routePath: getRequestPath(request),
      afterData: result.item,
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
    const session = await requirePermission("update_item");
    const contentType = request.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const itemId = Number(form.get("id"));
      const beforeItem = await getItemById(itemId);
      const file = form.get("image");
      let imagePath = form.get("imagePath") ? String(form.get("imagePath")) : null;

      if (file && typeof file !== "string" && file.size > 0) {
        const saved = await saveUpload(file);
        imagePath = saved.publicPath;
      }

      const result = await updateItemController({
        id: itemId,
        name: String(form.get("name") ?? ""),
        categoryId: form.get("categoryId") ? Number(form.get("categoryId")) : null,
        category: String(form.get("category") ?? ""),
        assetTag: form.get("assetTag") ? String(form.get("assetTag")) : null,
        sku: form.get("sku") ? String(form.get("sku")) : null,
        serialNumber: form.get("serialNumber") ? String(form.get("serialNumber")) : null,
        description: form.get("description") ? String(form.get("description")) : null,
        responsibleName: form.get("responsibleName") ? String(form.get("responsibleName")) : null,
        itemStatus: form.get("itemStatus") ? String(form.get("itemStatus")) : "em_estoque",
        locationName: form.get("locationName") ? String(form.get("locationName")) : null,
        supplierName: form.get("supplierName") ? String(form.get("supplierName")) : null,
        invoiceNumber: form.get("invoiceNumber") ? String(form.get("invoiceNumber")) : null,
        purchaseDate: normalizeDateInput(form.get("purchaseDate")),
        purchaseValue: form.get("purchaseValue") ? Number(form.get("purchaseValue")) : null,
        imagePath,
        qtyTotal: Number(form.get("qtyTotal") ?? 0),
        qtyMin: Number(form.get("qtyMin") ?? 0),
      });
      await recordAuditLog({
        entityType: "item",
        entityId: result.item.id ?? null,
        action: "update",
        actorUserId: session.userId,
        ipAddress: getRequestIp(request),
        routePath: getRequestPath(request),
        beforeData: beforeItem,
        afterData: result.item,
      });
      return NextResponse.json(result);
    }

    const body = await request.json();
    const beforeItem = await getItemById(Number(body.id));
    const result = await updateItemController(body);
    await recordAuditLog({
      entityType: "item",
      entityId: result.item.id ?? null,
      action: "update",
      actorUserId: session.userId,
      ipAddress: getRequestIp(request),
      routePath: getRequestPath(request),
      beforeData: beforeItem,
      afterData: result.item,
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
    const session = await requirePermission("delete_item");
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));
    const beforeItem = await getItemById(id);
    const result = await deleteItemController({ id, deletedBy: session.userId });
    await recordAuditLog({
      entityType: "item",
      entityId: id,
      action: "soft_delete",
      actorUserId: session.userId,
      ipAddress: getRequestIp(request),
      routePath: getRequestPath(request),
      beforeData: beforeItem,
      metadata: result.relations,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

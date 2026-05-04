import { NextResponse } from "next/server";

import {
  createCategoryController,
  deleteCategoryController,
  listCategoriesController,
  updateCategoryController,
} from "../../../controllers/categoryController";
import { requireAnyPermission, requirePermission } from "../../../lib/auth";
import { getRequestIp, getRequestPath } from "../../../lib/request";
import { getCategoryById } from "../../../repositories/categoryRepository";
import { recordAuditLog } from "../../../services/auditService";

export async function GET() {
  try {
    await requireAnyPermission(["view_items", "manage_categories"]);
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
    const session = await requirePermission("manage_categories");
    const body = await request.json();
    const result = await createCategoryController({
      name: String(body.name ?? ""),
      description: body.description ? String(body.description) : null,
    });
    await recordAuditLog({
      entityType: "category",
      entityId: result.category.id,
      action: "create",
      actorUserId: session.userId,
      ipAddress: getRequestIp(request),
      routePath: getRequestPath(request),
      afterData: result.category,
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
    const session = await requirePermission("manage_categories");
    const body = await request.json();
    const beforeCategory = await getCategoryById(Number(body.id));
    const result = await updateCategoryController({
      id: Number(body.id),
      name: String(body.name ?? ""),
      description: body.description ? String(body.description) : null,
    });
    await recordAuditLog({
      entityType: "category",
      entityId: result.category.id,
      action: "update",
      actorUserId: session.userId,
      ipAddress: getRequestIp(request),
      routePath: getRequestPath(request),
      beforeData: beforeCategory,
      afterData: result.category,
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
    const session = await requirePermission("manage_categories");
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));
    const beforeCategory = await getCategoryById(id);
    const result = await deleteCategoryController({ id, deletedBy: session.userId });
    await recordAuditLog({
      entityType: "category",
      entityId: id,
      action: "soft_delete",
      actorUserId: session.userId,
      ipAddress: getRequestIp(request),
      routePath: getRequestPath(request),
      beforeData: beforeCategory,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ ok: false, error: message }, { status });
  }
}

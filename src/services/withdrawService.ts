import type { StockMovement } from "../models/StockMovement";
import { getItemById } from "../repositories/itemRepository";
import {
  createMovement,
  getUpdatedItemFromMovement,
  updateMovementGlpiStatus,
} from "../repositories/stockMovementRepository";
import { postTicketFollowup, verifyTicket } from "./glpiService";
import { findSectorById } from "./sectorService";

export async function withdrawItem(input: {
  itemId: number;
  quantity: number;
  requestedBy: number;
  movementType: "in" | "out" | "transfer";
  sectorId?: number | null;
  glpiTicketNumber?: string | null;
  notes?: string | null;
  confirmed: boolean;
}) {
  if (!input.confirmed) {
    throw new Error("Confirmation required");
  }

  if (input.quantity <= 0) {
    throw new Error("Quantity must be greater than zero");
  }

  if (input.movementType === "transfer" && !input.sectorId) {
    throw new Error("Sector is required for transfers");
  }

  if (input.movementType === "out") {
    if (!input.glpiTicketNumber) {
      throw new Error("GLPI ticket required");
    }

    const ticket = await verifyTicket(input.glpiTicketNumber);
    if (!ticket.ok) {
      throw new Error("Invalid GLPI ticket");
    }
  }

  const item = await getItemById(input.itemId);
  if (!item) {
    throw new Error("Item not found");
  }

  const sector = input.sectorId ? await findSectorById(input.sectorId) : null;

  const movement: StockMovement = {
    id: 0,
    itemId: input.itemId,
    movementType: input.movementType,
    quantity: input.quantity,
    requestedBy: input.requestedBy,
    sectorId: input.sectorId ?? null,
    glpiTicketNumber: input.glpiTicketNumber ?? null,
    glpiCommentStatus: input.movementType === "out" ? "pending" : null,
    notes: input.notes ?? null,
  };

  const saved = await createMovement(movement);

  let glpiCommentStatus = "not_requested";
  let glpiError: string | null = null;

  if (input.glpiTicketNumber) {
    const sectorLabel = sector?.name ?? "setor nao informado";
    const actionLabel =
      input.movementType === "out"
        ? "saida"
        : input.movementType === "in"
          ? "entrada"
          : "transferencia";

    const messageLines = [
      "Movimentacao registrada automaticamente pelo Estoque TI.",
      `O produto ${item.name} teve ${actionLabel} para o setor ${sectorLabel}.`,
      `Quantidade movimentada: ${input.quantity}.`,
    ];

    if (item.assetTag) {
      messageLines.push(`Patrimonio: ${item.assetTag}.`);
    }

    if (input.notes) {
      messageLines.push(`Observacao: ${input.notes}.`);
    }

    try {
      await postTicketFollowup({
        ticketNumber: input.glpiTicketNumber,
        message: messageLines.join("\n"),
      });
      glpiCommentStatus = "success";
      await updateMovementGlpiStatus(saved.id, glpiCommentStatus);
    } catch (error) {
      glpiCommentStatus = "error";
      glpiError = error instanceof Error ? error.message : "Falha ao comentar no GLPI";
      await updateMovementGlpiStatus(saved.id, glpiCommentStatus);
    }
  } else {
    await updateMovementGlpiStatus(saved.id, glpiCommentStatus);
  }

  const updatedItem = await getUpdatedItemFromMovement(saved);

  return { movement: saved, item: updatedItem, glpiCommentStatus, glpiError };
}

import type { StockMovement } from "../models/StockMovement";
import { createMovement, getUpdatedItemFromMovement } from "../repositories/stockMovementRepository";
import { postWithdrawalComment, verifyTicket } from "./glpiService";

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

  if (input.movementType === "out") {
    if (!input.glpiTicketNumber) {
      throw new Error("GLPI ticket required");
    }

    const ticket = await verifyTicket(input.glpiTicketNumber);
    if (!ticket.ok) {
      throw new Error("Invalid GLPI ticket");
    }
  }

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
  if (input.movementType === "out" && input.glpiTicketNumber) {
    await postWithdrawalComment(input.glpiTicketNumber, "Equipamento retirado no sistema.");
  }

  const item = await getUpdatedItemFromMovement(saved);

  return { movement: saved, item };
}

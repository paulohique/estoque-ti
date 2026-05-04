import type { StockMovement } from "../models/StockMovement";
import { createMovement } from "../repositories/stockMovementRepository";
import { postWithdrawalComment, verifyTicket } from "./glpiService";

export async function withdrawItem(input: {
  itemId: number;
  quantity: number;
  requestedBy: number;
  sectorId?: number | null;
  glpiTicketNumber: string;
  notes?: string | null;
  confirmed: boolean;
}) {
  if (!input.confirmed) {
    throw new Error("Confirmation required");
  }

  if (!input.glpiTicketNumber) {
    throw new Error("GLPI ticket required");
  }

  const ticket = await verifyTicket(input.glpiTicketNumber);
  if (!ticket.ok) {
    throw new Error("Invalid GLPI ticket");
  }

  const movement: StockMovement = {
    id: 0,
    itemId: input.itemId,
    movementType: "out",
    quantity: input.quantity,
    requestedBy: input.requestedBy,
    sectorId: input.sectorId ?? null,
    glpiTicketNumber: input.glpiTicketNumber,
    glpiCommentStatus: "pending",
    notes: input.notes ?? null,
  };

  const saved = await createMovement(movement);
  await postWithdrawalComment(input.glpiTicketNumber, "Equipamento retirado no sistema.");

  return saved;
}

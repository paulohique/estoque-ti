export type MovementType = "in" | "out" | "transfer";

export interface StockMovement {
  id: number;
  itemId: number;
  movementType: MovementType;
  quantity: number;
  requestedBy: number;
  sectorId?: number | null;
  glpiTicketNumber?: string | null;
  glpiCommentStatus?: string | null;
  notes?: string | null;
  createdAt?: string;
}

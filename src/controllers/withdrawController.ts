import { withdrawItem } from "../services/withdrawService";

export async function withdrawController(input: {
  itemId: number;
  quantity: number;
  requestedBy: number;
  movementType: "in" | "out" | "transfer";
  sectorId?: number | null;
  glpiTicketNumber?: string | null;
  notes?: string | null;
  confirmed: boolean;
}) {
  const result = await withdrawItem(input);
  return { ok: true, ...result };
}

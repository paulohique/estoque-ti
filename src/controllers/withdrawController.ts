import { withdrawItem } from "../services/withdrawService";

export async function withdrawController(input: {
  itemId: number;
  quantity: number;
  requestedBy: number;
  sectorId?: number | null;
  glpiTicketNumber: string;
  notes?: string | null;
  confirmed: boolean;
}) {
  const movement = await withdrawItem(input);
  return { ok: true, movement };
}

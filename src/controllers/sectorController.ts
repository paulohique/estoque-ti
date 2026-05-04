import type { Sector } from "../models/Sector";
import { addSector, editSector, getSectors, removeSector } from "../services/sectorService";

export async function listSectorsController() {
  const sectors = await getSectors();
  return { ok: true, sectors };
}

export async function createSectorController(input: { name: string; description?: string | null }) {
  const sector = await addSector(input);
  return { ok: true, sector };
}

export async function updateSectorController(input: Sector) {
  const sector = await editSector(input);
  return { ok: true, sector };
}

export async function deleteSectorController(input: { id: number; deletedBy?: number }) {
  await removeSector(input.id, input.deletedBy);
  return { ok: true };
}

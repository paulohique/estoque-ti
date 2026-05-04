import type { Sector } from "../models/Sector";
import {
  createSector,
  deleteSector,
  findSectorByNormalizedName,
  getSectorById,
  listSectors,
  updateSector,
} from "../repositories/sectorRepository";

export async function getSectors() {
  return listSectors();
}

export async function findSectorById(id: number) {
  return getSectorById(id);
}

export async function addSector(input: { name: string; description?: string | null }) {
  const name = input.name.trim();
  if (!name) {
    throw new Error("Sector name is required");
  }

  const existing = await findSectorByNormalizedName(name);
  if (existing) {
    throw new Error("A sector with this name already exists");
  }

  return createSector({
    name,
    description: input.description?.trim() || null,
  });
}

export async function editSector(input: Sector) {
  const name = input.name.trim();
  if (!input.id) {
    throw new Error("Sector id is required");
  }
  if (!name) {
    throw new Error("Sector name is required");
  }

  const existing = await findSectorByNormalizedName(name);
  if (existing && existing.id !== input.id) {
    throw new Error("A sector with this name already exists");
  }

  return updateSector({
    ...input,
    name,
    description: input.description?.trim() || null,
  });
}

export async function removeSector(id: number, deletedBy?: number) {
  const sector = await getSectorById(id);
  if (!sector) {
    throw new Error("Sector not found");
  }

  try {
    await deleteSector(id, deletedBy);
  } catch {
    throw new Error("This sector is already linked to movements and cannot be deleted");
  }
}

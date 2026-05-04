import { registerItemImage } from "../services/uploadService";

export async function uploadController(input: {
  itemId: number;
  fileName: string;
  filePath: string;
}) {
  const image = await registerItemImage(input);
  return { ok: true, image };
}

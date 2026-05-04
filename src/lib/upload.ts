import fs from "fs/promises";
import path from "path";

export async function saveUpload(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileName = `${Date.now()}-${safeName}`;
  const filePath = path.join(uploadsDir, fileName);
  await fs.writeFile(filePath, buffer);

  return {
    fileName,
    publicPath: `/uploads/${fileName}`,
  };
}

import fs from "fs/promises";
import path from "path";

export async function saveUpload(file: File) {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const maxFileSize = 5 * 1024 * 1024;

  if (!allowedMimeTypes.includes(file.type)) {
    throw new Error("Only JPG, PNG, WEBP or GIF images are allowed");
  }

  if (file.size > maxFileSize) {
    throw new Error("Image must be up to 5MB");
  }

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

export async function removeUpload(publicPath?: string | null) {
  if (!publicPath || !publicPath.startsWith("/uploads/")) {
    return;
  }

  const filePath = path.join(process.cwd(), "public", publicPath.replace("/uploads/", "uploads/"));

  try {
    await fs.unlink(filePath);
  } catch {
    // Ignore missing files or cleanup failures.
  }
}

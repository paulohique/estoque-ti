import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";

function parseEnv(content) {
  const values = {};

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    values[key] = value;
  }

  return values;
}

async function loadEnvFile() {
  try {
    const envPath = path.join(process.cwd(), ".env");
    const content = await fs.readFile(envPath, "utf8");
    const parsed = parseEnv(content);

    for (const [key, value] of Object.entries(parsed)) {
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch {
    // Ignore missing .env.
  }
}

async function ensureGenericImage() {
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });

  const genericImagePath = path.join(uploadsDir, "demo-item.svg");
  const imageContent = `
<svg width="640" height="360" viewBox="0 0 640 360" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="640" height="360" rx="28" fill="#0F172A"/>
  <rect x="36" y="36" width="568" height="288" rx="22" fill="#111827" stroke="#334155" stroke-width="2"/>
  <circle cx="140" cy="120" r="44" fill="#14B8A6" fill-opacity="0.18"/>
  <circle cx="500" cy="240" r="58" fill="#F59E0B" fill-opacity="0.16"/>
  <rect x="112" y="92" width="216" height="16" rx="8" fill="#E2E8F0" fill-opacity="0.85"/>
  <rect x="112" y="126" width="160" height="10" rx="5" fill="#94A3B8"/>
  <rect x="112" y="154" width="258" height="10" rx="5" fill="#94A3B8"/>
  <rect x="112" y="182" width="198" height="10" rx="5" fill="#94A3B8"/>
  <rect x="112" y="228" width="136" height="44" rx="14" fill="#0EA5E9"/>
  <text x="140" y="257" fill="#FFFFFF" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700">TI</text>
  <text x="340" y="150" fill="#E2E8F0" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700">Inventario</text>
  <text x="340" y="186" fill="#94A3B8" font-family="Arial, Helvetica, sans-serif" font-size="16">Imagem generica para produtos</text>
</svg>
`.trimStart();

  await fs.writeFile(genericImagePath, imageContent, "utf8");
  return "/uploads/demo-item.svg";
}

async function run() {
  await loadEnvFile();
  const publicPath = await ensureGenericImage();

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASS ?? "",
    database: process.env.DB_NAME ?? "",
  });

  try {
    await connection.beginTransaction();

    const [items] = await connection.query(
      "SELECT id, image_path FROM items WHERE deleted_at IS NULL ORDER BY id ASC",
    );

    let updatedItems = 0;
    let createdImages = 0;

    for (const item of items) {
      if (item.image_path !== publicPath) {
        await connection.query("UPDATE items SET image_path = ? WHERE id = ?", [publicPath, item.id]);
        updatedItems += 1;
      }

      const [imageRows] = await connection.query(
        "SELECT COUNT(*) AS count FROM item_images WHERE item_id = ?",
        [item.id],
      );

      if (Number(imageRows[0]?.count ?? 0) === 0) {
        await connection.query(
          "INSERT INTO item_images (item_id, file_name, file_path) VALUES (?, ?, ?)",
          [item.id, "demo-item.svg", publicPath],
        );
        createdImages += 1;
      }
    }

    await connection.commit();
    console.log(
      `demo images applied: items_updated=${updatedItems}, item_images_created=${createdImages}, public_path=${publicPath}`,
    );
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    await connection.end();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
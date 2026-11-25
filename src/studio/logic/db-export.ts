import type { CustomHardwareItem } from "../firebase/AuthContext";
import type { BenchLayoutMap } from "../firebase/payload-validators";

/**
 * Resize and compress a browser File/Blob photo into a lightweight JPEG data URL
 * (max 480px dimension, ~30-75KB) safe for Firestore document limits & NeonDB portability.
 */
export async function compressHardwarePhotoToDataUrl(
  file: Blob,
  maxDimension = 480,
  quality = 0.72,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read image file"));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Invalid image format"));
      img.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas 2D unavailable"));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        let dataUrl = canvas.toDataURL("image/jpeg", quality);
        if (dataUrl.length > 130000) {
          dataUrl = canvas.toDataURL("image/jpeg", 0.5);
        }
        resolve(dataUrl);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

function sqlEscape(value: string): string {
  return value.replace(/'/g, "''");
}

/**
 * Generates a ready-to-run NeonDB (PostgreSQL) schema + data migration SQL script
 * and Upstash Redis caching blueprint for the user's current inventory & custom photo parts.
 */
export function buildNeonAndUpstashExport(params: {
  userId: string;
  userEmail: string;
  ownedParts: Record<string, number>;
  customPhotoParts: CustomHardwareItem[];
  benchLayout: BenchLayoutMap;
}): { sql: string; upstashConfig: string } {
  const { userId, userEmail, ownedParts, customPhotoParts, benchLayout } = params;

  const ownedRows = Object.entries(ownedParts)
    .filter(([, qty]) => qty > 0)
    .map(
      ([partId, qty]) =>
        `INSERT INTO hardware_inventory (user_id, part_id, quantity) VALUES ('${sqlEscape(userId)}', '${sqlEscape(partId)}', ${Math.floor(qty)}) ON CONFLICT (user_id, part_id) DO UPDATE SET quantity = EXCLUDED.quantity;`,
    );

  const customRows = customPhotoParts.map(
    (item) =>
      `INSERT INTO custom_hardware_parts (id, user_id, name, category, quantity, voltage, interface_spec, notes, photo_data_url) VALUES ('${sqlEscape(item.id)}', '${sqlEscape(userId)}', '${sqlEscape(item.name)}', '${sqlEscape(item.category)}', ${Math.floor(item.quantity)}, '${sqlEscape(item.voltage)}', '${sqlEscape(item.interfaceSpec)}', '${sqlEscape(item.notes)}', ${item.photoDataUrl ? `'${sqlEscape(item.photoDataUrl)}'` : "NULL"}) ON CONFLICT (id) DO NOTHING;`,
  );

  const sql = `-- ESP-Labs Studio -> NeonDB (PostgreSQL Free Tier) Migration Script
-- Exported for: ${userEmail}

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hardware_inventory (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  part_id TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity >= 0 AND quantity <= 999),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, part_id)
);

CREATE TABLE IF NOT EXISTS custom_hardware_parts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(32) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  voltage VARCHAR(40) DEFAULT '3.3V',
  interface_spec VARCHAR(60) DEFAULT 'GPIO',
  notes TEXT DEFAULT '',
  photo_data_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bench_3d_layouts (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  layout_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO users (id, email) VALUES ('${sqlEscape(userId)}', '${sqlEscape(userEmail)}') ON CONFLICT (id) DO NOTHING;

${ownedRows.join("\n") || "-- No catalog parts selected yet"}

${customRows.join("\n") || "-- No custom photo parts added yet"}

INSERT INTO bench_3d_layouts (user_id, layout_json)
VALUES ('${sqlEscape(userId)}', '${sqlEscape(JSON.stringify(benchLayout))}'::jsonb)
ON CONFLICT (user_id) DO UPDATE SET layout_json = EXCLUDED.layout_json, updated_at = NOW();
`;

  const upstashConfig = JSON.stringify(
    {
      provider: "Upstash Redis (Serverless Free Tier)",
      cacheKeyStrategy: {
        userInventoryKey: `esplabs:v1:inv:${userId}`,
        recommendationsKey: `esplabs:v1:recs:${userId}`,
        ttlSeconds: 300,
        invalidateOnMutation: ["POST /api/inventory", "POST /api/custom-parts", "DELETE /api/custom-parts/:id"],
      },
      envTemplate: [
        "DATABASE_URL=postgresql://<user>:<pass>@<host>.neon.tech/esplabs?sslmode=require",
        "UPSTASH_REDIS_REST_URL=https://<instance>.upstash.io",
        "UPSTASH_REDIS_REST_TOKEN=<your-rest-token>",
      ],
    },
    null,
    2,
  );

  return { sql, upstashConfig };
}

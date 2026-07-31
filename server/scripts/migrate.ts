import * as fs from "node:fs/promises";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { pool, query } from "../src/db.js";

const migrationsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "migrations");

async function main() {
  await query(`CREATE TABLE IF NOT EXISTS _migrations (
    filename TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`);

  const applied = new Set(
    (await query<{ filename: string }>("SELECT filename FROM _migrations")).rows.map((r) => r.filename),
  );
  const files = (await fs.readdir(migrationsDir)).filter((f) => f.endsWith(".sql")).sort();

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = await fs.readFile(path.join(migrationsDir, file), "utf-8");
    console.log(`Applying ${file}...`);
    await query(sql);
    await query("INSERT INTO _migrations (filename) VALUES ($1)", [file]);
  }
  console.log("Migrations up to date.");
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

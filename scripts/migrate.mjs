// Apply Supabase migrations via direct pg connection
// Usage: DB_PASSWORD=xxx node scripts/migrate.mjs
import pg from "pg";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, "..", "supabase", "migrations");

const password = process.env.DB_PASSWORD;
if (!password) {
  console.error("Set DB_PASSWORD env var");
  process.exit(1);
}

const projectRef = "zheqsaeieqrpxxxuzpcf";

// Try pooler first (works behind NAT), fallback to direct
const candidates = [
  {
    label: "pooler:eu-west-3",
    connectionString: `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-eu-west-3.pooler.supabase.com:6543/postgres`,
  },
  {
    label: "pooler:eu-central-1",
    connectionString: `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`,
  },
  {
    label: "pooler:eu-west-1",
    connectionString: `postgresql://postgres.${projectRef}:${encodeURIComponent(password)}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`,
  },
  {
    label: "direct",
    connectionString: `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`,
  },
];

async function tryConnect() {
  for (const cand of candidates) {
    const client = new pg.Client({
      connectionString: cand.connectionString,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });
    try {
      await client.connect();
      console.log(`[ok] connected via ${cand.label}`);
      return client;
    } catch (e) {
      console.warn(`[warn] ${cand.label} failed:`, e.message);
      try { await client.end(); } catch {}
    }
  }
  throw new Error("All connection attempts failed");
}

async function main() {
  const client = await tryConnect();

  const files = (await fs.readdir(MIGRATIONS_DIR))
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const f of files) {
    const sql = await fs.readFile(path.join(MIGRATIONS_DIR, f), "utf8");
    console.log(`\n[run] ${f}`);
    try {
      await client.query(sql);
      console.log(`[ok]  ${f} applied`);
    } catch (e) {
      console.error(`[err] ${f}:`, e.message);
      throw e;
    }
  }

  await client.end();
  console.log("\nAll migrations applied.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

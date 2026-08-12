import "dotenv/config";
import { createClient } from "@libsql/client";
import { readFileSync } from "fs";

const url = process.env.DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url?.startsWith("libsql:") && !url?.startsWith("https:")) {
  throw new Error("DATABASE_URL must be a Turso libsql/https URL");
}
if (!authToken) throw new Error("Missing TURSO_AUTH_TOKEN");

const sql = readFileSync("prisma/turso-init.sql", "utf8");
const statements = sql
  .split(";")
  .map((s) =>
    s
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith("--"))
      .join("\n")
      .trim(),
  )
  .filter((s) => s.length > 0);

const client = createClient({ url, authToken });

for (const statement of statements) {
  const preview = statement.replace(/\s+/g, " ").slice(0, 72);
  process.stdout.write(`→ ${preview}...\n`);
  await client.execute(statement);
}

const tables = await client.execute(
  "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
);
console.log(
  "OK. Tables:",
  tables.rows.map((r) => r.name).join(", "),
);
client.close();

import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Prisma CLI cannot use libsql:// — keep a local SQLite for migrate/db push.
    // The app reads DATABASE_URL (Turso) at runtime via the libsql adapter.
    url: process.env["LOCAL_DATABASE_URL"] ?? process.env["DATABASE_URL"],
  },
});

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma/client";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const raw = process.env.DATABASE_URL ?? "file:./prisma/dev.db";

  if (raw.startsWith("libsql:") || raw.startsWith("https://")) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaLibSql } = require("@prisma/adapter-libsql") as typeof import("@prisma/adapter-libsql");
    const adapter = new PrismaLibSql({
      url: raw,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    return new PrismaClient({ adapter });
  }

  let url = raw;
  if (url.startsWith("file:")) {
    const filePath = url.slice("file:".length);
    if (!path.isAbsolute(filePath)) {
      url = `file:${path.join(/*turbopackIgnore: true*/ process.cwd(), filePath)}`;
    }
  }

  const adapter = new PrismaBetterSqlite3({ url });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

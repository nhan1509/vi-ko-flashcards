import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-better-sqlite3",
    "better-sqlite3",
    "@libsql/client",
    "@prisma/adapter-libsql",
  ],
};

export default nextConfig;

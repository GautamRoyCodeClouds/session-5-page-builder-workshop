import "dotenv/config";

import { defineConfig } from "prisma/config";

const databaseUrl = process.env.DIRECT_URL
  ?? process.env.DATABASE_URL
  ?? "postgresql://session5:session5@127.0.0.1:54329/session5?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations"
  },
  datasource: {
    url: databaseUrl
  }
});

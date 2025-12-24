// Prisma Configuration for migrations (local development only)
// For production, Vercel uses environment variables directly
import { defineConfig } from "prisma/config";

// Only load dotenv in non-production environments
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DIRECT_URL"] || process.env["DATABASE_URL"],
  },
});

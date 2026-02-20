import { loadEnv } from "./load-env";
import { defineConfig } from "drizzle-kit";

loadEnv();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set. Create a .env file (copy .env.example) or export DATABASE_URL before running drizzle-kit.");
}

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});

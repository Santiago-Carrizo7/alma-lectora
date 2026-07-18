import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { config } from 'dotenv';
import { defineConfig, env } from "prisma/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carga el archivo .env de forma absoluta relativa a este archivo de configuración
config({ path: resolve(__dirname, '.env') });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: 'pnpm exec tsx prisma/seed.ts',
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
import { defineConfig } from 'drizzle-kit';

process.loadEnvFile();

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/database/schema',
  out: './drizzle',
  schemaFilter: ['chakra'], // only manage the "chakra" schema
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});

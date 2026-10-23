import { pgSchema } from 'drizzle-orm/pg-core';

// Postgres schema that holds all app tables (instead of "public").
// Define tables with chakraSchema.table(...) and enums with chakraSchema.enum(...).
export const chakraSchema = pgSchema('chakra');

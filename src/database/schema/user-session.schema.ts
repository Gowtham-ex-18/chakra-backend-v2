import { bigint, index, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { chakraSchema } from './chakra.schema';
import { users } from './user.schema';

// One row per login. Access and refresh tokens carry the session's `jti`,
// so revoking the row (logout) invalidates both tokens immediately.
export const userSessions = chakraSchema.table(
  'user_sessions',
  {
    id: bigint('id', { mode: 'number' })
      .primaryKey()
      .generatedAlwaysAsIdentity(),

    jti: uuid('jti').notNull().unique(),

    userId: bigint('user_id', { mode: 'number' })
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    ipAddress: varchar('ip_address', { length: 45 }),

    userAgent: varchar('user_agent', { length: 512 }),

    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),

    revokedAt: timestamp('revoked_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index('user_sessions_user_id_idx').on(table.userId)],
);

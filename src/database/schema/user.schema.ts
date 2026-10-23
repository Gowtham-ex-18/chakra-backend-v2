import { compare, hash, hashSync } from 'bcryptjs';
import { bigint, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { UserRole } from '../../common/enums/user.enum';
import { chakraSchema } from './chakra.schema';
import {
  generatePublicId,
  PUBLIC_ID_LENGTH,
} from '../../common/utils/public-id';

export const userRoleEnum = chakraSchema.enum('user_role', UserRole);

export const users = chakraSchema.table('users', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),

  userId: varchar('user_id', { length: PUBLIC_ID_LENGTH })
    .notNull()
    .unique()
    .$defaultFn(() => generatePublicId()),

  franchiseId: uuid('franchise_id'),

  employeeId: bigint('employee_id', { mode: 'number' }),

  name: varchar('name').notNull(),

  email: varchar('email').notNull().unique(),

  role: userRoleEnum('role').notNull(),

  password: varchar('password').notNull(),

  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// ---- Password hashing (the `password` column always stores a bcrypt hash) ----

const SALT_ROUNDS = 10;

// Used when no user was found, so a wrong email takes as long as a wrong
// password (attackers can't probe which emails exist).
const DUMMY_PASSWORD_HASH = hashSync('dummy-password', SALT_ROUNDS);

export function hashPassword(plainPassword: string): Promise<string> {
  return hash(plainPassword, SALT_ROUNDS);
}

/** True if the password matches. Pass `undefined` when the user doesn't exist. */
export async function comparePassword(
  plainPassword: string,
  passwordHash: string | undefined,
): Promise<boolean> {
  const matches = await compare(
    plainPassword,
    passwordHash ?? DUMMY_PASSWORD_HASH,
  );
  return matches && passwordHash !== undefined;
}

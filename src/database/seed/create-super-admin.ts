/**
 * Creates the first super admin, so someone can log in and create other users.
 *
 * Either set SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD / SEED_ADMIN_NAME in .env and run:
 *   npm run seed:admin
 * or pass them directly (these win over .env):
 *   npm run seed:admin -- --email admin@chakra.com --password "StrongPass123" --name "Admin"
 */
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { parseArgs } from 'node:util';
import { UserRole } from '../../common/enums/user.enum';
import { hashPassword, users } from '../schema/user.schema';

async function main() {
  process.loadEnvFile();

  const { values } = parseArgs({
    options: {
      email: { type: 'string' },
      password: { type: 'string' },
      name: { type: 'string' },
    },
  });

  const email = (values.email ?? process.env.SEED_ADMIN_EMAIL)
    ?.trim()
    .toLowerCase();
  const password = values.password ?? process.env.SEED_ADMIN_PASSWORD;
  const name = values.name ?? process.env.SEED_ADMIN_NAME ?? 'Super Admin';

  if (!email || !password) {
    throw new Error(
      'Missing email or password.\n' +
        '  Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in .env and run: npm run seed:admin\n' +
        '  or run: npm run seed:admin -- --email <email> --password <password> [--name <name>]',
    );
  }
  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  const db = drizzle({ connection: process.env.DATABASE_URL! });
  try {
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing) {
      console.log(`User ${email} already exists, nothing to do.`);
      return;
    }

    const [admin] = await db
      .insert(users)
      .values({
        email,
        name,
        role: UserRole.SuperAdmin,
        password: await hashPassword(password),
      })
      .returning({ userId: users.userId });

    console.log(`Created super admin ${email} (userId: ${admin.userId})`);
  } finally {
    await db.$client.end();
  }
}

main().catch((err: Error) => {
  console.error(err.message);
  process.exit(1);
});

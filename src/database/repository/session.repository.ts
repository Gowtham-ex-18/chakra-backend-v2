import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { and, eq, gt, isNull } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { User } from '../../common/interfaces/user.interface';
import { userSessions } from '../schema/user-session.schema';
import { users } from '../schema/user.schema';

export type NewSession = typeof userSessions.$inferInsert;

@Injectable()
export class SessionRepository {
  constructor(@InjectDrizzle() private readonly db: NodePgDatabase) {}

  async create(data: NewSession): Promise<void> {
    await this.db.insert(userSessions).values(data);
  }

  /** Returns the session's user if the session is active (not revoked, not expired). */
  async findActiveUser(
    jti: string,
    publicUserId: string,
  ): Promise<User | undefined> {
    const [row] = await this.db
      .select({ user: users })
      .from(userSessions)
      .innerJoin(users, eq(userSessions.userId, users.id))
      .where(
        and(
          eq(userSessions.jti, jti),
          eq(users.userId, publicUserId),
          isNull(userSessions.revokedAt),
          gt(userSessions.expiresAt, new Date()),
        ),
      )
      .limit(1);
    return row?.user;
  }

  /** Swaps the session to a new jti (refresh-token rotation). False if it was no longer active. */
  async rotate(jti: string, newJti: string, expiresAt: Date): Promise<boolean> {
    const updated = await this.db
      .update(userSessions)
      .set({ jti: newJti, expiresAt })
      .where(
        and(
          eq(userSessions.jti, jti),
          isNull(userSessions.revokedAt),
          gt(userSessions.expiresAt, new Date()),
        ),
      )
      .returning({ id: userSessions.id });
    return updated.length > 0;
  }

  async revoke(jti: string): Promise<void> {
    await this.db
      .update(userSessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(userSessions.jti, jti), isNull(userSessions.revokedAt)));
  }
}

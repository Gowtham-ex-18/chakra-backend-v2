import { Injectable } from '@nestjs/common';
import { InjectDrizzle } from '@nestjs/drizzle';
import { desc, eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { User } from '../../common/interfaces/user.interface';
import { users } from '../schema/user.schema';

export type NewUser = typeof users.$inferInsert;
export type UpdateUserData = Partial<Omit<NewUser, 'id' | 'userId'>>;

@Injectable()
export class UserRepository {
  constructor(@InjectDrizzle() private readonly db: NodePgDatabase) {}

  findAll(): Promise<User[]> {
    return this.db.select().from(users).orderBy(desc(users.createdAt));
  }

  async findByUserId(userId: string): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.userId, userId))
      .limit(1);
    return user;
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return user;
  }

  async create(data: NewUser): Promise<User> {
    const [user] = await this.db.insert(users).values(data).returning();
    return user;
  }

  async update(
    userId: string,
    data: UpdateUserData,
  ): Promise<User | undefined> {
    const [user] = await this.db
      .update(users)
      .set(data)
      .where(eq(users.userId, userId))
      .returning();
    return user;
  }

  async delete(userId: string): Promise<boolean> {
    const deleted = await this.db
      .delete(users)
      .where(eq(users.userId, userId))
      .returning({ id: users.id });
    return deleted.length > 0;
  }
}

import { Global, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DrizzleModule } from '@nestjs/drizzle';
import { drizzle } from 'drizzle-orm/node-postgres';
import { LogColor } from '../common/logger/log-colors';
import { SessionRepository } from './repository/session.repository';
import { UserRepository } from './repository/user.repository';

const repositories = [UserRepository, SessionRepository];

const logger = new Logger('Database');

@Global()
@Module({
  providers: repositories,
  exports: repositories,
  imports: [
    DrizzleModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const url = config.getOrThrow<string>('DATABASE_URL');

        const { hostname, port, pathname } = new URL(url);
        const target = `${hostname}:${port}${pathname}`;

        logger.log(LogColor.cyan(`🛜 Connecting to ${target}...`));
        const db = drizzle({ connection: url });

        try {
          await db.$client.query('SELECT 1');
        } catch (err) {
          logger.error(
            `Connection to ${target} failed: ${(err as Error).message}`,
          );
          await db.$client.end();
          throw err;
        }

        logger.log(LogColor.magenta(`🚀 Connected to ${target}`));
        return { db };
      },
    }),
  ],
})
export class DatabaseModule {}

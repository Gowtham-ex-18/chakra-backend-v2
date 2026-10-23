import { ConsoleLogger, LogLevel } from '@nestjs/common';

const LOG_LEVELS: LogLevel[] = ['verbose', 'debug', 'log', 'warn', 'error', 'fatal'];

/**
 * App-wide logger built on Nest's ConsoleLogger.
 * Colored, readable output with timestamps and all log levels.
 *
 * Registered once in main.ts via app.useLogger(). In classes, use
 * `private readonly logger = new Logger(MyClass.name)` and it routes here.
 */
export class AppLogger extends ConsoleLogger {
  constructor(context?: string) {
    super(context ?? 'App', {
      prefix: 'Chakra',
      json: false,
      colors: true,
      timestamp: true,
      logLevels: LOG_LEVELS,
    });
  }
}

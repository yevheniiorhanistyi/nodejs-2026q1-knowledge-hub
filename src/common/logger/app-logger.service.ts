import { ConsoleLogger, Injectable, LogLevel } from '@nestjs/common';
import { createLogStream } from './file-rotation';
import { RotatingFileStream } from 'rotating-file-stream';

const isProduction = process.env.NODE_ENV === 'production';

@Injectable()
export class AppLogger extends ConsoleLogger {
  private readonly fileStream: RotatingFileStream;

  constructor(options?: { logLevels?: LogLevel[]; context?: string }) {
    super(options?.context ?? '', { logLevels: options?.logLevels });
    this.fileStream = createLogStream();
  }

  private writeToFile(level: string, message: unknown, context?: string) {
    const entry = JSON.stringify({
      level,
      timestamp: new Date().toISOString(),
      context: context ?? this.context,
      message,
    });
    this.fileStream.write(entry + '\n');
  }

  log(message: unknown, context?: string) {
    super.log(message, context);
    this.writeToFile('log', message, context);
  }

  error(message: unknown, stack?: string, context?: string) {
    super.error(message, stack, context);
    this.writeToFile('error', { message, stack }, context);
  }

  warn(message: unknown, context?: string) {
    super.warn(message, context);
    this.writeToFile('warn', message, context);
  }

  debug(message: unknown, context?: string) {
    super.debug(message, context);
    this.writeToFile('debug', message, context);
  }

  verbose(message: unknown, context?: string) {
    super.verbose(message, context);
    this.writeToFile('verbose', message, context);
  }
}

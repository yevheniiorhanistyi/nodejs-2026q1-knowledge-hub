import { LogLevel } from '@nestjs/common';

const VALID_LEVELS: LogLevel[] = ['log', 'debug', 'warn', 'error', 'verbose'];

export function resolveLogLevels(): LogLevel[] {
  const requested = process.env.LOG_LEVEL as LogLevel;
  const level = VALID_LEVELS.includes(requested) ? requested : 'log';
  return VALID_LEVELS.slice(VALID_LEVELS.indexOf(level));
}

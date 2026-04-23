import { createStream, RotatingFileStream } from 'rotating-file-stream';
import * as path from 'path';
import * as fs from 'fs';

const LOG_DIR = path.resolve(process.cwd(), 'logs');

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function getMaxSize(): string {
  const kb = parseInt(process.env.LOG_MAX_FILE_SIZE ?? '1024', 10);
  return `${kb}K`;
}

function filenameGenerator(time: number | Date | null): string {
  if (!time) return 'app.log';
  const date = time instanceof Date ? time : new Date(time);
  const ts = date.toISOString().replace(/:/g, '-').replace(/\..+/, '');
  return `app-${ts}.log`;
}

export function createLogStream(): RotatingFileStream {
  return createStream(filenameGenerator, {
    size: getMaxSize(),
    path: LOG_DIR,
    compress: false,
  });
}

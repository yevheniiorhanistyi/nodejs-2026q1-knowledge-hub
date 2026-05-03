import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

@Injectable()
export class AiCacheService {
  private readonly logger = new Logger(AiCacheService.name);
  private readonly store = new Map<string, CacheEntry>();
  private readonly ttlMs: number;

  constructor(private readonly config: ConfigService) {
    const ttlSec = this.config.get<number>('ai.cacheTtlSec', 300);
    this.ttlMs = ttlSec * 1000;
    this.logger.log(`Cache TTL configured: ${ttlSec}s`);
  }

  buildKey(parts: Record<string, unknown>): string {
    const sorted = Object.keys(parts)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = parts[k];
        return acc;
      }, {});
    return JSON.stringify(sorted);
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.logger.debug('Cache entry expired and evicted');
      return null;
    }

    this.logger.debug('Cache hit');
    return entry.value as T;
  }

  set(key: string, value: unknown): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
    });
    this.logger.debug(`Cached entry, expires in ${this.ttlMs / 1000}s`);
  }
}

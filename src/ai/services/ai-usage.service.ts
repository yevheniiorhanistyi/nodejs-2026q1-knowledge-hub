import { Injectable } from '@nestjs/common';

export interface EndpointStats {
  count: number;
  totalLatencyMs: number;
  avgLatencyMs: number;
}

export interface UsageStats {
  totalRequests: number;
  byEndpoint: Record<string, EndpointStats>;
  totalTokens: number;
  cache: {
    hits: number;
    misses: number;
    hitRatio: string;
  };
  startedAt: string;
}

@Injectable()
export class AiUsageService {
  private readonly startedAt = new Date().toISOString();
  private totalRequests = 0;
  private byEndpoint: Record<string, EndpointStats> = {};
  private totalTokens = 0;
  private cacheHits = 0;
  private cacheMisses = 0;

  track(endpoint: string, tokens?: number, latencyMs?: number): void {
    this.totalRequests++;

    if (!this.byEndpoint[endpoint]) {
      this.byEndpoint[endpoint] = {
        count: 0,
        totalLatencyMs: 0,
        avgLatencyMs: 0,
      };
    }

    const stats = this.byEndpoint[endpoint];
    stats.count++;

    if (latencyMs != null) {
      stats.totalLatencyMs += latencyMs;
      stats.avgLatencyMs = Math.round(stats.totalLatencyMs / stats.count);
    }

    if (tokens != null) this.totalTokens += tokens;
  }

  trackCacheHit(): void {
    this.cacheHits++;
    this.totalRequests++;
  }

  trackCacheMiss(): void {
    this.cacheMisses++;
  }

  getStats(): UsageStats {
    const total = this.cacheHits + this.cacheMisses;
    const hitRatio =
      total === 0 ? '0%' : `${Math.round((this.cacheHits / total) * 100)}%`;

    return {
      totalRequests: this.totalRequests,
      byEndpoint: { ...this.byEndpoint },
      totalTokens: this.totalTokens,
      cache: {
        hits: this.cacheHits,
        misses: this.cacheMisses,
        hitRatio,
      },
      startedAt: this.startedAt,
    };
  }
}

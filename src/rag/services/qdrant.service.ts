import {
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';

export interface VectorPoint {
  id: string;
  vector: number[];
  payload: {
    articleId: string;
    articleTitle: string;
    chunkIndex: number;
    chunkText: string;
    status?: string;
    categoryId?: string | null;
    tags?: string[];
  };
}

export interface SearchResult {
  id: string;
  score: number;
  payload: VectorPoint['payload'];
}

@Injectable()
export class QdrantService implements OnModuleInit {
  private readonly logger = new Logger(QdrantService.name);
  private readonly baseUrl: string;
  private readonly collection: string;
  private readonly vectorDim = 3072;

  constructor(private readonly config: ConfigService) {
    this.baseUrl = this.config.get<string>('rag.url', 'http://vectordb:6333');
    this.collection = this.config.get<string>(
      'rag.collection',
      'knowledge_hub_articles',
    );
  }

  async onModuleInit() {
    await this.ensureCollection();
  }

  private async ensureCollection(): Promise<void> {
    try {
      const exists = await this.collectionExists();
      if (!exists) {
        await this.createCollection();
        this.logger.log(`Created Qdrant collection: ${this.collection}`);
      } else {
        this.logger.log(`Qdrant collection exists: ${this.collection}`);
      }
    } catch (err) {
      this.logger.error(
        `Failed to ensure Qdrant collection: ${(err as Error).message}`,
      );
    }
  }

  private async collectionExists(): Promise<boolean> {
    try {
      await axios.get(`${this.baseUrl}/collections/${this.collection}`, {
        timeout: 10_000,
      });
      return true;
    } catch {
      return false;
    }
  }

  private async createCollection(): Promise<void> {
    await this.request('put', `/collections/${this.collection}`, {
      vectors: {
        size: this.vectorDim,
        distance: 'Cosine',
      },
    });
  }

  async upsertPoints(points: VectorPoint[]): Promise<void> {
    if (points.length === 0) return;

    const body = {
      points: points.map((p) => ({
        id: this.toNumericId(p.id),
        vector: p.vector,
        payload: p.payload,
      })),
    };

    await this.request('put', `/collections/${this.collection}/points`, body);
    this.logger.debug(`Upserted ${points.length} points to Qdrant`);
  }

  async deleteByArticleId(articleId: string): Promise<number> {
    const response = await this.request(
      'post',
      `/collections/${this.collection}/points/delete`,
      {
        filter: {
          must: [{ key: 'articleId', match: { value: articleId } }],
        },
      },
    );
    const deleted = response?.result?.deleted ?? 0;
    this.logger.debug(`Deleted ${deleted} points for article ${articleId}`);
    return deleted;
  }

  async countByArticleId(articleId: string): Promise<number> {
    const response = await this.request(
      'post',
      `/collections/${this.collection}/points/count`,
      {
        filter: {
          must: [{ key: 'articleId', match: { value: articleId } }],
        },
      },
    );
    return response?.result?.count ?? 0;
  }

  async search(
    vector: number[],
    limit: number,
    filter?: {
      status?: string;
      categoryId?: string;
      tags?: string[];
    },
  ): Promise<SearchResult[]> {
    const must: object[] = [];

    if (filter?.status) {
      must.push({ key: 'status', match: { value: filter.status } });
    }
    if (filter?.categoryId) {
      must.push({ key: 'categoryId', match: { value: filter.categoryId } });
    }
    if (filter?.tags && filter.tags.length > 0) {
      must.push({ key: 'tags', match: { any: filter.tags } });
    }

    const body: Record<string, unknown> = {
      vector,
      limit,
      with_payload: true,
    };

    if (must.length > 0) {
      body.filter = { must };
    }

    const response = await this.request(
      'post',
      `/collections/${this.collection}/points/search`,
      body,
    );

    return (response?.result ?? []).map((r: any) => ({
      id: r.id,
      score: r.score,
      payload: r.payload,
    }));
  }

  async getCollectionInfo(): Promise<{ vectorsCount: number }> {
    const response = await this.request(
      'get',
      `/collections/${this.collection}`,
    );
    return {
      vectorsCount: response?.result?.vectors_count ?? 0,
    };
  }

  private async request(
    method: 'get' | 'put' | 'post' | 'delete',
    path: string,
    data?: object,
  ): Promise<any> {
    try {
      const response = await axios({
        method,
        url: `${this.baseUrl}${path}`,
        data,
        timeout: 30_000,
        headers: { 'Content-Type': 'application/json' },
      });
      return response.data;
    } catch (err) {
      const error = err as AxiosError;
      if (
        error.code === 'ECONNREFUSED' ||
        error.code === 'ENOTFOUND' ||
        error.code === 'ECONNABORTED'
      ) {
        throw new ServiceUnavailableException(
          'Vector database is unavailable. Please try again later.',
        );
      }
      this.logger.error(
        `Qdrant error [${method.toUpperCase()} ${path}]: ${error.message}`,
      );
      this.logger.error(
        `Qdrant response: ${JSON.stringify(error.response?.data)}`,
      );
      throw new ServiceUnavailableException(
        `Vector database error: ${error.response?.status ?? 'unknown'}`,
      );
    }
  }

  private toNumericId(id: string): number {
    let hash = 5381;
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) + hash + id.charCodeAt(i)) & 0x7fffffff;
    }
    return Math.abs(hash);
  }
}

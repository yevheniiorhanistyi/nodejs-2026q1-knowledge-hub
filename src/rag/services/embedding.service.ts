import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.getOrThrow<string>('ai.apiKey');
    this.baseUrl = this.config.get<string>(
      'ai.baseUrl',
      'https://generativelanguage.googleapis.com',
    );
    this.model = this.config.get<string>(
      'ai.embeddingModel',
      'gemini-embedding-001',
    );
  }

  async embedText(text: string): Promise<number[]> {
    const url = `${this.baseUrl}/v1beta/models/${this.model}:embedContent`;

    try {
      const response = await axios.post(
        url,
        {
          model: `models/${this.model}`,
          content: { parts: [{ text }] },
        },
        {
          params: { key: this.apiKey },
          timeout: 30_000,
        },
      );

      const embedding: number[] = response.data?.embedding?.values;
      if (!embedding || embedding.length === 0) {
        throw new ServiceUnavailableException(
          'Empty embedding returned from Gemini',
        );
      }

      this.logger.debug(
        `Embedded text (${text.length} chars), dim=${embedding.length}`,
      );
      return embedding;
    } catch (err) {
      const error = err as AxiosError;

      if (error.response?.status === 401 || error.response?.status === 403) {
        this.logger.error('Gemini embedding auth error');
        throw new ServiceUnavailableException(
          'AI service authentication failed',
        );
      }

      this.logger.error(`Embedding error: ${error.message}`);
      this.logger.error(
        `Embedding response: ${JSON.stringify(error.response?.data)}`,
      );
      this.logger.error(`Embedding URL: ${url}`);
      this.logger.error(`Embedding error: ${error.message}`);
      throw new ServiceUnavailableException(
        'AI embedding service is temporarily unavailable',
      );
    }
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];
    for (const text of texts) {
      const embedding = await this.embedText(text);
      results.push(embedding);
      await this.sleep(100);
    }
    return results;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

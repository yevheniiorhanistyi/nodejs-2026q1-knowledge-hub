import {
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';
import { ConversationMessage } from './ai-session.service';

export interface GeminiResult {
  text: string;
  tokenCount?: number;
  latencyMs: number;
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly model: string;
  private readonly maxRetries = 3;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.getOrThrow<string>('ai.apiKey');
    this.baseUrl = this.config.get<string>(
      'ai.baseUrl',
      'https://generativelanguage.googleapis.com',
    );
    this.model = this.config.get<string>('ai.model', 'gemini-2.5-flash');
  }

  async generate(
    prompt: string,
    history: ConversationMessage[] = [],
  ): Promise<GeminiResult> {
    const url = `${this.baseUrl}/v1beta/models/${this.model}:generateContent`;

    const contents = [
      ...history.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.text }],
      })),
      { role: 'user', parts: [{ text: prompt }] },
    ];

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const startedAt = Date.now();
      try {
        const response = await axios.post(
          url,
          { contents },
          {
            params: { key: this.apiKey },
            timeout: 30_000,
          },
        );

        const latencyMs = Date.now() - startedAt;
        const text: string =
          response.data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        const tokenCount: number | undefined =
          response.data?.usageMetadata?.totalTokenCount;

        this.logger.debug(
          `Gemini response in ${latencyMs}ms, tokens: ${tokenCount ?? 'unknown'}`,
        );

        return { text, tokenCount, latencyMs };
      } catch (err) {
        const error = err as AxiosError;
        const status = error.response?.status;

        if (status === 429 || status === 503) {
          if (attempt < this.maxRetries) {
            const delay = Math.pow(2, attempt) * 1000;
            this.logger.warn(
              `Gemini unavailable (attempt ${attempt + 1}), retrying in ${delay}ms`,
            );
            await this.sleep(delay);
            continue;
          }
          throw new ServiceUnavailableException(
            'AI service is temporarily unavailable. Please try again later.',
          );
        }

        if (status === 401 || status === 403) {
          this.logger.error(`Gemini authentication error: HTTP ${status}`);
          throw new InternalServerErrorException(
            'AI service configuration error. Contact support.',
          );
        }

        if (
          error.code === 'ECONNABORTED' ||
          error.code === 'ERR_NETWORK' ||
          error.code === 'ENOTFOUND'
        ) {
          this.logger.error(`Gemini network error: ${error.code}`);
          throw new ServiceUnavailableException(
            'AI service is unreachable. Please try again later.',
          );
        }

        this.logger.error(
          `Gemini unexpected error: ${error.message} (HTTP ${status ?? 'no response'})`,
        );
        this.logger.error(
          `Gemini response data: ${JSON.stringify(error.response?.data)}`,
        );
        throw new ServiceUnavailableException(
          'AI service returned an unexpected error.',
        );
      }
    }

    throw new ServiceUnavailableException(
      'AI service unavailable after retries.',
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

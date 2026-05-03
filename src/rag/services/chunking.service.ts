import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface TextChunk {
  text: string;
  index: number;
  startChar: number;
  endChar: number;
}

@Injectable()
export class ChunkingService {
  private readonly logger = new Logger(ChunkingService.name);
  private readonly chunkSize: number;
  private readonly chunkOverlap: number;

  constructor(private readonly config: ConfigService) {
    this.chunkSize = this.config.get<number>('rag.chunkSize', 800);
    this.chunkOverlap = this.config.get<number>('rag.chunkOverlap', 200);
  }

  chunk(text: string): TextChunk[] {
    if (!text || text.trim().length === 0) return [];

    const chunks: TextChunk[] = [];
    const step = this.chunkSize - this.chunkOverlap;
    let index = 0;

    for (let start = 0; start < text.length; start += step) {
      const end = Math.min(start + this.chunkSize, text.length);
      const chunkText = text.slice(start, end).trim();

      if (chunkText.length > 0) {
        chunks.push({
          text: chunkText,
          index,
          startChar: start,
          endChar: end,
        });
        index++;
      }

      if (end === text.length) break;
    }

    this.logger.debug(
      `Chunked text (${text.length} chars) into ${chunks.length} chunks ` +
        `(size=${this.chunkSize}, overlap=${this.chunkOverlap})`,
    );

    return chunks;
  }
}

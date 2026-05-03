import { Module } from '@nestjs/common';

import { ArticleModule } from '../article/article.module';
import { AiModule } from '../ai/ai.module';
import { RagController } from './rag.controller';
import { QdrantService } from './services/qdrant.service';
import { EmbeddingService } from './services/embedding.service';
import { ChunkingService } from './services/chunking.service';
import { RagConversationService } from './services/rag-conversation.service';

@Module({
  imports: [ArticleModule, AiModule],
  controllers: [RagController],
  providers: [
    QdrantService,
    EmbeddingService,
    ChunkingService,
    RagConversationService,
  ],
})
export class RagModule {}

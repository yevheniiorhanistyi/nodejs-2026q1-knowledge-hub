import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Logger,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import {
  ApiTags,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

import { Public } from '../common/decorators/public.decorator';
import { ArticleService } from '../article/article.service';
import { QdrantService } from './services/qdrant.service';
import { EmbeddingService } from './services/embedding.service';
import { ChunkingService } from './services/chunking.service';
import { RagConversationService } from './services/rag-conversation.service';
import { GeminiService } from '../ai/services/gemini.service';
import { ReindexDto, RagSearchDto, RagChatDto } from './dto/rag.dto';
import { buildRagChatPrompt } from './prompts/rag-chat.prompt';

@ApiTags('RAG')
@Public()
@Controller('ai/rag')
export class RagController {
  private readonly logger = new Logger(RagController.name);
  private readonly collection: string;

  constructor(
    private readonly articles: ArticleService,
    private readonly qdrant: QdrantService,
    private readonly embedding: EmbeddingService,
    private readonly chunking: ChunkingService,
    private readonly conversation: RagConversationService,
    private readonly gemini: GeminiService,
    private readonly config: ConfigService,
  ) {
    this.collection = this.config.get<string>(
      'RAG_VECTOR_COLLECTION',
      'knowledge_hub_articles',
    );
  }

  @Post('index')
  @HttpCode(200)
  @ApiOkResponse({ description: 'Indexes articles into vector DB.' })
  async index(@Body() dto: ReindexDto) {
    const status = dto.onlyPublished !== false ? 'published' : undefined;

    let articleList = await this.articles.findAll(status);

    if (dto.articleIds && dto.articleIds.length > 0) {
      articleList = articleList.filter((a) => dto.articleIds!.includes(a.id));
    }

    let indexedChunks = 0;

    for (const article of articleList) {
      await this.qdrant.deleteByArticleId(article.id);

      const chunks = this.chunking.chunk(article.content);
      if (chunks.length === 0) continue;

      const points = [];

      for (const chunk of chunks) {
        const vector = await this.embedding.embedText(chunk.text);

        points.push({
          id: `${article.id}_${chunk.index}`,
          vector,
          payload: {
            articleId: article.id,
            articleTitle: article.title,
            chunkIndex: chunk.index,
            chunkText: chunk.text,
            status: article.status,
            categoryId: article.categoryId ?? null,
            tags: article.tags ?? [],
          },
        });
      }

      await this.qdrant.upsertPoints(points);
      indexedChunks += points.length;

      this.logger.log(
        `Indexed article "${article.title}" → ${points.length} chunks`,
      );
    }

    return {
      indexedArticles: articleList.length,
      indexedChunks,
      vectorCollection: this.collection,
    };
  }

  @Post('search')
  @HttpCode(200)
  @ApiOkResponse({ description: 'Semantic search in indexed articles.' })
  @ApiBadRequestResponse({ description: 'query is missing.' })
  async search(@Body() dto: RagSearchDto) {
    const queryVector = await this.embedding.embedText(dto.query);

    const results = await this.qdrant.search(queryVector, dto.limit ?? 5, {
      status: dto.articleStatus,
      categoryId: dto.categoryId,
      tags: dto.tags,
    });

    return {
      results: results.map((r) => ({
        articleId: r.payload.articleId,
        articleTitle: r.payload.articleTitle,
        chunk: r.payload.chunkText,
        similarity: Math.round(r.score * 1000) / 1000,
      })),
    };
  }

  @Post('chat')
  @HttpCode(200)
  @ApiOkResponse({ description: 'RAG-powered chat response.' })
  @ApiBadRequestResponse({ description: 'question is missing.' })
  async chat(@Body() dto: RagChatDto) {
    const conversationId = dto.conversationId ?? randomUUID();

    const queryVector = await this.embedding.embedText(dto.question);

    const searchResults = await this.qdrant.search(queryVector, 5);

    const history = this.conversation.getHistory(conversationId).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const prompt = buildRagChatPrompt(
      dto.question,
      searchResults.map((r) => ({
        articleTitle: r.payload.articleTitle,
        chunkText: r.payload.chunkText,
      })),
      history,
    );

    const { text } = await this.gemini.generate(prompt);
    const answer = text.trim();

    this.conversation.addMessage(conversationId, 'user', dto.question);
    this.conversation.addMessage(conversationId, 'assistant', answer);

    return {
      answer,
      sources: searchResults.map((r) => ({
        articleId: r.payload.articleId,
        articleTitle: r.payload.articleTitle,
        relevantChunk: r.payload.chunkText,
      })),
      conversationId,
    };
  }

  @Delete('index/articles/:articleId')
  @HttpCode(204)
  @ApiNotFoundResponse({ description: 'Article or index entries not found.' })
  async deleteFromIndex(@Param('articleId', ParseUUIDPipe) articleId: string) {
    await this.articles.findOne(articleId);

    const deleted = await this.qdrant.deleteByArticleId(articleId);
    if (deleted === 0) {
      throw new NotFoundException(
        `No index entries found for article ${articleId}`,
      );
    }
  }

  @Get('chat/:conversationId/history')
  @SkipThrottle()
  @ApiOkResponse({ description: 'Returns conversation history.' })
  @ApiNotFoundResponse({ description: 'Conversation not found.' })
  getHistory(@Param('conversationId') conversationId: string) {
    const conv = this.conversation.getConversation(conversationId);
    if (!conv) {
      throw new NotFoundException(`Conversation ${conversationId} not found`);
    }
    return conv;
  }
}

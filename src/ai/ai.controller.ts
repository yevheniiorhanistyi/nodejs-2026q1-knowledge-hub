import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

import { Public } from '../common/decorators/public.decorator';
import { ArticleService } from '../article/article.service';
import { GeminiService } from './services/gemini.service';
import { AiCacheService } from './services/ai-cache.service';
import { AiUsageService } from './services/ai-usage.service';
import { AiSessionService } from './services/ai-session.service';
import { SummarizeArticleDto } from './dto/summarize-article.dto';
import { TranslateArticleDto } from './dto/translate-article.dto';
import { AnalyzeArticleDto } from './dto/analyze-article.dto';
import { GenerateDto } from './dto/generate.dto';
import { buildSummarizePrompt } from './prompts/summarize.prompt';
import { buildTranslatePrompt } from './prompts/translate.prompt';
import { buildAnalyzePrompt } from './prompts/analyze.prompt';

function parseJsonSafe<T>(text: string, fallback: T): T {
  try {
    const clean = text
      .trim()
      .replace(/^```json\s*|^```\s*|```$/gm, '')
      .trim();
    return JSON.parse(clean) as T;
  } catch {
    return fallback;
  }
}

function validateTranslateResponse(raw: unknown): {
  translatedText: string;
  detectedLanguage: string;
} {
  if (
    raw &&
    typeof raw === 'object' &&
    'translatedText' in raw &&
    'detectedLanguage' in raw &&
    typeof (raw as any).translatedText === 'string' &&
    typeof (raw as any).detectedLanguage === 'string'
  ) {
    return raw as { translatedText: string; detectedLanguage: string };
  }
  return {
    translatedText: typeof raw === 'string' ? raw : JSON.stringify(raw),
    detectedLanguage: 'unknown',
  };
}

function validateAnalyzeResponse(raw: unknown): {
  analysis: string;
  suggestions: string[];
  severity: 'info' | 'warning' | 'error';
} {
  const validSeverities = ['info', 'warning', 'error'];

  if (raw && typeof raw === 'object') {
    const obj = raw as any;
    return {
      analysis:
        typeof obj.analysis === 'string'
          ? obj.analysis
          : String(obj.analysis ?? ''),
      suggestions: Array.isArray(obj.suggestions)
        ? obj.suggestions.filter((s: unknown) => typeof s === 'string')
        : [],
      severity: validSeverities.includes(obj.severity) ? obj.severity : 'info',
    };
  }

  return {
    analysis: typeof raw === 'string' ? raw : '',
    suggestions: [],
    severity: 'info',
  };
}

@ApiTags('AI')
@Public()
@Controller('ai')
export class AiController {
  constructor(
    private readonly gemini: GeminiService,
    private readonly cache: AiCacheService,
    private readonly usage: AiUsageService,
    private readonly session: AiSessionService,
    private readonly articles: ArticleService,
  ) {}

  @Post('articles/:articleId/summarize')
  @HttpCode(200)
  @ApiOkResponse({ description: 'Returns a summary of the article.' })
  @ApiNotFoundResponse({ description: 'Article not found.' })
  async summarize(
    @Param('articleId', ParseUUIDPipe) articleId: string,
    @Body() dto: SummarizeArticleDto,
  ) {
    const article = await this.articles.findOne(articleId);
    const maxLength = dto.maxLength ?? 'medium';

    const cacheKey = this.cache.buildKey({
      op: 'summarize',
      articleId,
      maxLength,
      updatedAt: article.updatedAt,
    });

    const cached = this.cache.get<object>(cacheKey);
    if (cached) {
      this.usage.trackCacheHit();
      return cached;
    }
    this.usage.trackCacheMiss();

    const prompt = buildSummarizePrompt(article.content, maxLength);
    const { text, tokenCount, latencyMs } = await this.gemini.generate(prompt);
    this.usage.track('summarize', tokenCount, latencyMs);

    const result = {
      articleId,
      summary: text.trim(),
      originalLength: article.content.length,
      summaryLength: text.trim().length,
    };

    this.cache.set(cacheKey, result);
    return result;
  }

  @Post('articles/:articleId/translate')
  @HttpCode(200)
  @ApiOkResponse({ description: 'Returns translated article content.' })
  @ApiNotFoundResponse({ description: 'Article not found.' })
  @ApiBadRequestResponse({ description: 'targetLanguage is missing.' })
  async translate(
    @Param('articleId', ParseUUIDPipe) articleId: string,
    @Body() dto: TranslateArticleDto,
  ) {
    const article = await this.articles.findOne(articleId);

    const cacheKey = this.cache.buildKey({
      op: 'translate',
      articleId,
      targetLanguage: dto.targetLanguage,
      sourceLanguage: dto.sourceLanguage ?? null,
      updatedAt: article.updatedAt,
    });

    const cached = this.cache.get<object>(cacheKey);
    if (cached) {
      this.usage.trackCacheHit();
      return cached;
    }
    this.usage.trackCacheMiss();

    const prompt = buildTranslatePrompt(
      article.content,
      dto.targetLanguage,
      dto.sourceLanguage,
    );
    const { text, tokenCount, latencyMs } = await this.gemini.generate(prompt);
    this.usage.track('translate', tokenCount, latencyMs);

    const raw = parseJsonSafe<unknown>(text, text.trim());
    const parsed = validateTranslateResponse(raw);

    const result = { articleId, ...parsed };
    this.cache.set(cacheKey, result);
    return result;
  }

  @Post('articles/:articleId/analyze')
  @HttpCode(200)
  @ApiOkResponse({ description: 'Returns content analysis and suggestions.' })
  @ApiNotFoundResponse({ description: 'Article not found.' })
  async analyze(
    @Param('articleId', ParseUUIDPipe) articleId: string,
    @Body() dto: AnalyzeArticleDto,
  ) {
    const article = await this.articles.findOne(articleId);
    const task = dto.task ?? 'review';

    const prompt = buildAnalyzePrompt(article.content, task);
    const { text, tokenCount, latencyMs } = await this.gemini.generate(prompt);
    this.usage.track('analyze', tokenCount, latencyMs);

    const raw = parseJsonSafe<unknown>(text, text.trim());
    const parsed = validateAnalyzeResponse(raw);

    return { articleId, ...parsed };
  }

  @Post('generate')
  @HttpCode(200)
  @ApiOkResponse({
    description: 'Returns AI-generated response for a free-form prompt.',
  })
  async generate(@Body() dto: GenerateDto) {
    const history = dto.sessionId ? this.session.getHistory(dto.sessionId) : [];

    const { text, tokenCount, latencyMs } = await this.gemini.generate(
      dto.prompt,
      history,
    );
    this.usage.track('generate', tokenCount, latencyMs);

    if (dto.sessionId) {
      this.session.addMessage(dto.sessionId, {
        role: 'user',
        text: dto.prompt,
      });
      this.session.addMessage(dto.sessionId, {
        role: 'model',
        text: text.trim(),
      });
    }

    return {
      response: text.trim(),
      sessionId: dto.sessionId ?? null,
      historyLength: history.length,
    };
  }

  @Get('usage')
  @SkipThrottle()
  @ApiOkResponse({ description: 'Returns AI usage statistics since startup.' })
  getUsage() {
    return {
      ...this.usage.getStats(),
      sessions: this.session.getStats(),
    };
  }
}

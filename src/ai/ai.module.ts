import { Module } from '@nestjs/common';

import { ArticleModule } from '../article/article.module';
import { AiController } from './ai.controller';
import { GeminiService } from './services/gemini.service';
import { AiCacheService } from './services/ai-cache.service';
import { AiUsageService } from './services/ai-usage.service';
import { AiSessionService } from './services/ai-session.service';

@Module({
  imports: [ArticleModule],
  controllers: [AiController],
  providers: [GeminiService, AiCacheService, AiUsageService, AiSessionService],
})
export class AiModule {}

import { APP_GUARD } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { ArticleModule } from './article/article.module';
import { UserModule } from './user/user.module';
import { CommentModule } from './comment/comment.module';
import { CategoryModule } from './category/category.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { AiModule } from './ai/ai.module';
import { RagModule } from './rag/rag.module';

import authConfig from './config/auth.config';
import cryptoConfig from './config/crypto.config';
import dbConfig from './config/database.config';
import aiConfig from './config/ai.config';
import ragConfig from './config/rag.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [authConfig, cryptoConfig, dbConfig, aiConfig, ragConfig],
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: 60_000,
            limit: Number(config.get('AI_RATE_LIMIT_RPM')) || 20,
          },
        ],
      }),
    }),
    PrismaModule,
    ArticleModule,
    UserModule,
    CommentModule,
    CategoryModule,
    AuthModule,
    AiModule,
    RagModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}

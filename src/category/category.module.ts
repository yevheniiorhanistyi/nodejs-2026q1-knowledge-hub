import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { ArticleModule } from '../article/article.module';
import { CategoryController } from './category.controller';

@Module({
  imports: [ArticleModule],
  controllers: [CategoryController],
  providers: [CategoryService],
})
export class CategoryModule {}

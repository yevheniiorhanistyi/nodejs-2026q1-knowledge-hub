import { randomUUID } from 'node:crypto';
import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';

import { Article } from './entities/article.entity';
import { ArticleStatus } from './article.types';
import { CommentService } from '../comment/comment.service';

@Injectable()
export class ArticleService {
  private articles: Article[] = [];

  constructor(
    @Inject(forwardRef(() => CommentService))
    private readonly commentService: CommentService,
  ) {}

  create(createArticleDto: CreateArticleDto): Article {
    const newArticle = new Article();

    Object.assign(newArticle, {
      id: randomUUID(),
      ...createArticleDto,
      status: createArticleDto.status || ArticleStatus.DRAFT,

      tags: createArticleDto.tags ?? [],
      authorId: createArticleDto.authorId ?? null,
      categoryId: createArticleDto.categoryId ?? null,

      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    this.articles.push(newArticle);
    return newArticle;
  }

  findAll(status?: string, tag?: string, categoryId?: string): Article[] {
    return this.articles.filter((article) => {
      if (status && article.status !== status) return false;
      if (tag && !article.tags?.includes(tag)) return false;
      if (categoryId && article.categoryId !== categoryId) return false;
      return true;
    });
  }

  findOne(id: string) {
    const article = this.articles.find((a) => a.id === id);
    if (!article) throw new NotFoundException();

    return article;
  }

  update(id: string, updateArticleDto: UpdateArticleDto) {
    const article = this.articles.find((a) => a.id === id);
    if (!article) throw new NotFoundException();

    Object.assign(article, updateArticleDto);
    article.updatedAt = Date.now();
    return article;
  }

  remove(id: string) {
    const index = this.articles.findIndex((a) => a.id === id);
    if (index === -1) throw new NotFoundException();
    this.articles.splice(index, 1)[0];
    this.commentService.removeByArticleId(id);
  }

  nullifyAuthor(id: string) {
    this.articles.forEach((article) => {
      if (article.authorId === id) {
        article.authorId = null;
        article.updatedAt = Date.now();
      }
    });
  }

  nullifyCategory(id: string) {
    this.articles.forEach((article) => {
      if (article.categoryId === id) {
        article.categoryId = null;
        article.updatedAt = Date.now();
      }
    });
  }
}

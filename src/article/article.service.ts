import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateArticleDto } from './dto/create-article.dto';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ArticleStatus } from '@prisma/client';

@Injectable()
export class ArticleService {
  constructor(private readonly prisma: PrismaService) {}

  private mapArticle(article: any) {
    return {
      ...article,
      createdAt: article.createdAt.getTime(),
      updatedAt: article.updatedAt.getTime(),
      tags: article.tags.map((t: any) => t.name),
    };
  }

  async create(dto: CreateArticleDto) {
    const article = await this.prisma.article.create({
      data: {
        title: dto.title,
        content: dto.content,
        status: dto.status ?? ArticleStatus.draft,
        authorId: dto.authorId ?? null,
        categoryId: dto.categoryId ?? null,
        tags: {
          connectOrCreate: (dto.tags ?? []).map((name) => ({
            where: { name },
            create: { name },
          })),
        },
      },
      include: { tags: true },
    });
    return this.mapArticle(article);
  }

  async findAll(status?: string, tag?: string, categoryId?: string) {
    const articles = await this.prisma.article.findMany({
      where: {
        ...(status && { status: status as ArticleStatus }),
        ...(categoryId && { categoryId }),
        ...(tag && { tags: { some: { name: tag } } }),
      },
      include: { tags: true },
    });
    return articles.map((a) => this.mapArticle(a));
  }

  async findOne(id: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: { tags: true },
    });
    if (!article) throw new NotFoundException();
    return this.mapArticle(article);
  }

  async update(id: string, dto: UpdateArticleDto) {
    await this.findOne(id);
    const article = await this.prisma.article.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.content && { content: dto.content }),
        ...(dto.status && { status: dto.status }),
        ...(dto.authorId !== undefined && { authorId: dto.authorId }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.tags && {
          tags: {
            set: [],
            connectOrCreate: dto.tags.map((name) => ({
              where: { name },
              create: { name },
            })),
          },
        }),
      },
      include: { tags: true },
    });
    return this.mapArticle(article);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.article.delete({ where: { id } });
  }
}

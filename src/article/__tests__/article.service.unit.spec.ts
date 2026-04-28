import 'reflect-metadata';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { ArticleService } from '../article.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundError } from '../../common/errors/http-errors';
import { ArticleStatus } from '@prisma/client';

const now = new Date();

const fakeArticle = {
  id: 'article-1',
  title: 'Test Article',
  content: 'Content',
  status: ArticleStatus.draft,
  authorId: null,
  categoryId: null,
  createdAt: now,
  updatedAt: now,
  tags: [{ name: 'nestjs' }, { name: 'typescript' }],
};

const mockPrisma = {
  article: {
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

describe('ArticleService', () => {
  let service: ArticleService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        ArticleService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(ArticleService);
  });

  describe('create', () => {
    it('creates article with draft status by default', async () => {
      mockPrisma.article.create.mockResolvedValue(fakeArticle);

      await service.create({ title: 'Test', content: 'Body' } as any);

      const data = mockPrisma.article.create.mock.calls[0][0].data;
      expect(data.status).toBe(ArticleStatus.draft);
    });

    it('maps tags to array of strings', async () => {
      mockPrisma.article.create.mockResolvedValue(fakeArticle);

      const result = await service.create({
        title: 'Test',
        content: 'Body',
      } as any);

      expect(result.tags).toEqual(['nestjs', 'typescript']);
    });

    it('converts dates to timestamps', async () => {
      mockPrisma.article.create.mockResolvedValue(fakeArticle);

      const result = await service.create({
        title: 'Test',
        content: 'Body',
      } as any);

      expect(result.createdAt).toBe(now.getTime());
      expect(result.updatedAt).toBe(now.getTime());
    });

    it('creates with provided status', async () => {
      const published = { ...fakeArticle, status: ArticleStatus.published };
      mockPrisma.article.create.mockResolvedValue(published);

      await service.create({
        title: 'Test',
        content: 'Body',
        status: ArticleStatus.published,
      } as any);

      const data = mockPrisma.article.create.mock.calls[0][0].data;
      expect(data.status).toBe(ArticleStatus.published);
    });

    it('creates with tags using connectOrCreate', async () => {
      mockPrisma.article.create.mockResolvedValue(fakeArticle);

      await service.create({
        title: 'Test',
        content: 'Body',
        tags: ['nestjs'],
      } as any);

      const tags =
        mockPrisma.article.create.mock.calls[0][0].data.tags.connectOrCreate;
      expect(tags).toHaveLength(1);
      expect(tags[0].where).toEqual({ name: 'nestjs' });
    });
  });

  describe('findAll', () => {
    it('returns all articles when no filters', async () => {
      mockPrisma.article.findMany.mockResolvedValue([fakeArticle]);

      const result = await service.findAll();

      expect(result).toHaveLength(1);
      expect(mockPrisma.article.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
    });

    it('filters by status', async () => {
      mockPrisma.article.findMany.mockResolvedValue([fakeArticle]);

      await service.findAll('draft');

      const where = mockPrisma.article.findMany.mock.calls[0][0].where;
      expect(where.status).toBe('draft');
    });

    it('filters by tag', async () => {
      mockPrisma.article.findMany.mockResolvedValue([fakeArticle]);

      await service.findAll(undefined, 'nestjs');

      const where = mockPrisma.article.findMany.mock.calls[0][0].where;
      expect(where.tags).toEqual({ some: { name: 'nestjs' } });
    });

    it('filters by categoryId', async () => {
      mockPrisma.article.findMany.mockResolvedValue([fakeArticle]);

      await service.findAll(undefined, undefined, 'cat-1');

      const where = mockPrisma.article.findMany.mock.calls[0][0].where;
      expect(where.categoryId).toBe('cat-1');
    });
  });

  describe('findOne', () => {
    it('throws NotFoundError when article does not exist', async () => {
      mockPrisma.article.findUnique.mockResolvedValue(null);
      await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundError);
    });

    it('returns mapped article when found', async () => {
      mockPrisma.article.findUnique.mockResolvedValue(fakeArticle);

      const result = await service.findOne('article-1');

      expect(result.id).toBe('article-1');
      expect(result.tags).toEqual(['nestjs', 'typescript']);
    });
  });

  describe('update', () => {
    it('throws NotFoundError when article does not exist', async () => {
      mockPrisma.article.findUnique.mockResolvedValue(null);
      await expect(service.update('bad-id', { title: 'New' })).rejects.toThrow(
        NotFoundError,
      );
    });

    it('updates article fields', async () => {
      mockPrisma.article.findUnique.mockResolvedValue(fakeArticle);
      const updated = {
        ...fakeArticle,
        title: 'Updated',
        status: ArticleStatus.published,
      };
      mockPrisma.article.update.mockResolvedValue(updated);

      const result = await service.update('article-1', {
        title: 'Updated',
        status: ArticleStatus.published,
      });

      expect(result.title).toBe('Updated');
      expect(result.status).toBe(ArticleStatus.published);
    });

    it('replaces tags on update', async () => {
      mockPrisma.article.findUnique.mockResolvedValue(fakeArticle);
      mockPrisma.article.update.mockResolvedValue({
        ...fakeArticle,
        tags: [{ name: 'react' }],
      });

      const result = await service.update('article-1', { tags: ['react'] });

      expect(result.tags).toEqual(['react']);
    });
  });

  describe('remove', () => {
    it('throws NotFoundError when article does not exist', async () => {
      mockPrisma.article.findUnique.mockResolvedValue(null);
      await expect(service.remove('bad-id')).rejects.toThrow(NotFoundError);
    });

    it('deletes article when found', async () => {
      mockPrisma.article.findUnique.mockResolvedValue(fakeArticle);
      mockPrisma.article.delete.mockResolvedValue({});

      await service.remove('article-1');

      expect(mockPrisma.article.delete).toHaveBeenCalledWith({
        where: { id: 'article-1' },
      });
    });
  });
});

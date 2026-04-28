import 'reflect-metadata';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { UnprocessableEntityException } from '@nestjs/common';
import { CommentService } from '../comment.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundError } from '../../common/errors/http-errors';

const now = new Date();
const fakeComment = {
  id: 'comment-1',
  content: 'Great article!',
  articleId: 'article-1',
  authorId: 'user-1',
  createdAt: now,
};

const mockPrisma = {
  article: { findUnique: vi.fn() },
  comment: {
    create: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    delete: vi.fn(),
  },
};

describe('CommentService', () => {
  let service: CommentService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        CommentService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(CommentService);
  });

  describe('create', () => {
    it('throws UnprocessableEntityException when article does not exist', async () => {
      mockPrisma.article.findUnique.mockResolvedValue(null);
      await expect(
        service.create({
          content: 'Hi',
          articleId: 'bad-id',
          authorId: 'user-1',
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('creates comment when article exists', async () => {
      mockPrisma.article.findUnique.mockResolvedValue({ id: 'article-1' });
      mockPrisma.comment.create.mockResolvedValue(fakeComment);
      const result = await service.create({
        content: 'Great!',
        articleId: 'article-1',
        authorId: 'user-1',
      });
      expect(result.content).toBe('Great article!');
    });

    it('converts createdAt to timestamp', async () => {
      mockPrisma.article.findUnique.mockResolvedValue({ id: 'article-1' });
      mockPrisma.comment.create.mockResolvedValue(fakeComment);
      const result = await service.create({
        content: 'Hi',
        articleId: 'article-1',
        authorId: 'user-1',
      });
      expect(result.createdAt).toBe(now.getTime());
    });
  });

  describe('findOne', () => {
    it('throws NotFoundError when comment does not exist', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue(null);
      await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundError);
    });

    it('returns mapped comment when found', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue(fakeComment);
      const result = await service.findOne('comment-1');
      expect(result.id).toBe('comment-1');
      expect(result.createdAt).toBe(now.getTime());
    });
  });

  describe('findByArticleId', () => {
    it('returns comments for article', async () => {
      mockPrisma.comment.findMany.mockResolvedValue([fakeComment]);
      const result = await service.findByArticleId('article-1');
      expect(result).toHaveLength(1);
      expect(result[0].createdAt).toBe(now.getTime());
    });

    it('returns empty array when no comments', async () => {
      mockPrisma.comment.findMany.mockResolvedValue([]);
      const result = await service.findByArticleId('article-1');
      expect(result).toHaveLength(0);
    });
  });

  describe('remove', () => {
    it('throws NotFoundError when comment does not exist', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue(null);
      await expect(service.remove('bad-id')).rejects.toThrow(NotFoundError);
    });

    it('deletes comment when found', async () => {
      mockPrisma.comment.findUnique.mockResolvedValue(fakeComment);
      mockPrisma.comment.delete.mockResolvedValue({});
      await service.remove('comment-1');
      expect(mockPrisma.comment.delete).toHaveBeenCalledWith({
        where: { id: 'comment-1' },
      });
    });
  });
});

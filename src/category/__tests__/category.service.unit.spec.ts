import 'reflect-metadata';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { CategoryService } from '../category.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundError } from '../../common/errors/http-errors';

const fakeCategory = {
  id: 'cat-1',
  name: 'Tech',
  description: 'Tech articles',
};

const mockPrisma = {
  category: {
    upsert: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

describe('CategoryService', () => {
  let service: CategoryService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        CategoryService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(CategoryService);
  });

  describe('create', () => {
    it('creates category via upsert', async () => {
      mockPrisma.category.upsert.mockResolvedValue(fakeCategory);
      const result = await service.create({
        name: 'Tech',
        description: 'Tech articles',
      });
      expect(result).toEqual(fakeCategory);
      expect(mockPrisma.category.upsert).toHaveBeenCalledTimes(1);
    });

    it('updates description if category with same name exists', async () => {
      mockPrisma.category.upsert.mockResolvedValue({
        ...fakeCategory,
        description: 'Updated',
      });
      const result = await service.create({
        name: 'Tech',
        description: 'Updated',
      });
      expect(result.description).toBe('Updated');
    });
  });

  describe('findAll', () => {
    it('returns all categories', async () => {
      mockPrisma.category.findMany.mockResolvedValue([fakeCategory]);
      const result = await service.findAll();
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(fakeCategory);
    });

    it('returns empty array when no categories', async () => {
      mockPrisma.category.findMany.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('throws NotFoundError when category does not exist', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);
      await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundError);
    });

    it('returns category when found', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(fakeCategory);
      const result = await service.findOne('cat-1');
      expect(result).toEqual(fakeCategory);
    });
  });

  describe('update', () => {
    it('throws NotFoundError when category does not exist', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);
      await expect(service.update('bad-id', { name: 'New' })).rejects.toThrow(
        NotFoundError,
      );
    });

    it('updates category when found', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(fakeCategory);
      const updated = { ...fakeCategory, name: 'Updated' };
      mockPrisma.category.update.mockResolvedValue(updated);
      const result = await service.update('cat-1', { name: 'Updated' });
      expect(result.name).toBe('Updated');
    });
  });

  describe('remove', () => {
    it('throws NotFoundError when category does not exist', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(null);
      await expect(service.remove('bad-id')).rejects.toThrow(NotFoundError);
    });

    it('deletes category when found', async () => {
      mockPrisma.category.findUnique.mockResolvedValue(fakeCategory);
      mockPrisma.category.delete.mockResolvedValue({});
      await service.remove('cat-1');
      expect(mockPrisma.category.delete).toHaveBeenCalledWith({
        where: { id: 'cat-1' },
      });
    });
  });
});

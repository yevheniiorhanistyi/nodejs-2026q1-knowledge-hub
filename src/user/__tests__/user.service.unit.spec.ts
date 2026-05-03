import 'reflect-metadata';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { UserService } from '../user.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundError, ForbiddenError } from '../../common/errors/http-errors';
import * as bcrypt from 'bcryptjs';

const fakeUser = {
  id: '1',
  login: 'user1',
  password: 'hashed',
  role: 'viewer',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrisma = {
  user: {
    upsert: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(UserService);
  });

  describe('create', () => {
    it('hashes the password before saving', async () => {
      mockPrisma.user.upsert.mockResolvedValue(fakeUser);

      await service.create({ login: 'user1', password: 'plain' });

      const call = mockPrisma.user.upsert.mock.calls[0][0];
      expect(call.create.password).not.toBe('plain');
      expect(await bcrypt.compare('plain', call.create.password)).toBe(true);
    });

    it('returns user without password field', async () => {
      mockPrisma.user.upsert.mockResolvedValue(fakeUser);

      const result = await service.create({
        login: 'user1',
        password: 'plain',
      });

      expect((result as any).password).toBeUndefined();
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('login');
    });

    it('uses upsert so duplicate login updates instead of throwing', async () => {
      mockPrisma.user.upsert.mockResolvedValue(fakeUser);
      await service.create({ login: 'user1', password: 'plain' });
      expect(mockPrisma.user.upsert).toHaveBeenCalledTimes(1);
    });
  });

  describe('findAll', () => {
    it('returns array of users without passwords', async () => {
      mockPrisma.user.findMany.mockResolvedValue([fakeUser]);

      const result = await service.findAll();

      expect(Array.isArray(result)).toBe(true);
      expect((result[0] as any).password).toBeUndefined();
      expect(result[0]).toHaveProperty('login');
    });

    it('returns empty array when no users', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toHaveLength(0);
    });
  });

  describe('findOne', () => {
    it('throws NotFoundError when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundError);
    });

    it('returns user without password when found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(fakeUser);
      const result = await service.findOne('1');
      expect(result).toHaveProperty('id', '1');
      expect((result as any).password).toBeUndefined();
    });
  });

  describe('updatePassword', () => {
    it('throws NotFoundError when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.updatePassword('bad-id', {
          oldPassword: 'a',
          newPassword: 'b',
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it('throws ForbiddenError when old password is wrong', async () => {
      const hashed = await bcrypt.hash('correct', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        ...fakeUser,
        password: hashed,
      });
      await expect(
        service.updatePassword('1', {
          oldPassword: 'wrong',
          newPassword: 'new',
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('updates with hashed new password when old password is correct', async () => {
      const hashed = await bcrypt.hash('correct', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        ...fakeUser,
        password: hashed,
      });
      mockPrisma.user.update.mockResolvedValue(fakeUser);

      await service.updatePassword('1', {
        oldPassword: 'correct',
        newPassword: 'newpass',
      });

      const newHashed = mockPrisma.user.update.mock.calls[0][0].data.password;
      expect(await bcrypt.compare('newpass', newHashed)).toBe(true);
    });
  });

  describe('remove', () => {
    it('throws NotFoundError when user does not exist', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.remove('bad-id')).rejects.toThrow(NotFoundError);
    });

    it('deletes user when found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(fakeUser);
      mockPrisma.user.delete.mockResolvedValue({});
      await service.remove('1');
      expect(mockPrisma.user.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });
});

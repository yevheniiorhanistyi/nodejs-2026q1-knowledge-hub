import 'reflect-metadata';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ValidationError,
  ForbiddenError,
  UnauthorizedError,
} from '../../common/errors/http-errors';
import * as bcrypt from 'bcryptjs';

const fakeUser = {
  id: 'uuid-1',
  login: 'user1',
  password: 'hashed',
  role: 'viewer',
};

const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    create: vi.fn(),
  },
};

const mockJwt = {
  sign: vi.fn().mockReturnValue('signed.token'),
  verify: vi.fn(),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();
    service = module.get(AuthService);
  });

  describe('signup', () => {
    it('throws ValidationError when login is already taken', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(fakeUser);
      await expect(
        service.signup({ login: 'user1', password: 'pass' }),
      ).rejects.toThrow(ValidationError);
    });

    it('creates user with hashed password', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({ ...fakeUser, id: 'new-id' });

      await service.signup({ login: 'newuser', password: 'plain' });

      const savedPassword =
        mockPrisma.user.create.mock.calls[0][0].data.password;
      expect(savedPassword).not.toBe('plain');
      expect(await bcrypt.compare('plain', savedPassword)).toBe(true);
    });

    it('assigns viewer role on signup', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({ ...fakeUser, id: 'new-id' });

      await service.signup({ login: 'newuser', password: 'plain' });

      const role = mockPrisma.user.create.mock.calls[0][0].data.role;
      expect(role).toBe('viewer');
    });

    it('returns id and message on success', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({ ...fakeUser, id: 'new-id' });

      const result = await service.signup({
        login: 'newuser',
        password: 'plain',
      });

      expect(result).toHaveProperty('id', 'new-id');
      expect(result).toHaveProperty('message');
    });
  });

  describe('login', () => {
    it('throws ForbiddenError when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.login({ login: 'nobody', password: 'pass' }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('throws ForbiddenError when password is wrong', async () => {
      const hashed = await bcrypt.hash('correct', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        ...fakeUser,
        password: hashed,
      });
      await expect(
        service.login({ login: 'user1', password: 'wrong' }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('returns accessToken and refreshToken on success', async () => {
      const hashed = await bcrypt.hash('pass', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        ...fakeUser,
        password: hashed,
      });

      const result = await service.login({ login: 'user1', password: 'pass' });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('generates tokens with correct payload', async () => {
      const hashed = await bcrypt.hash('pass', 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        ...fakeUser,
        password: hashed,
      });

      await service.login({ login: 'user1', password: 'pass' });

      const signCall = mockJwt.sign.mock.calls[0][0];
      expect(signCall).toMatchObject({
        userId: 'uuid-1',
        login: 'user1',
        role: 'viewer',
      });
    });
  });

  describe('refresh', () => {
    it('throws UnauthorizedError when refreshToken is missing', async () => {
      await expect(service.refresh({ refreshToken: '' })).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it('throws ForbiddenError when token is invalid', async () => {
      mockJwt.verify.mockImplementation(() => {
        throw new Error('invalid');
      });
      await expect(
        service.refresh({ refreshToken: 'bad.token' }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('throws ForbiddenError when user from token not found', async () => {
      mockJwt.verify.mockReturnValue({ userId: 'ghost-id' });
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(
        service.refresh({ refreshToken: 'valid.token' }),
      ).rejects.toThrow(ForbiddenError);
    });

    it('returns new tokens on valid refresh', async () => {
      mockJwt.verify.mockReturnValue({ userId: 'uuid-1' });
      mockPrisma.user.findUnique.mockResolvedValue(fakeUser);

      const result = await service.refresh({ refreshToken: 'valid.token' });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('calls sign twice — access and refresh tokens', async () => {
      mockJwt.verify.mockReturnValue({ userId: 'uuid-1' });
      mockPrisma.user.findUnique.mockResolvedValue(fakeUser);

      await service.refresh({ refreshToken: 'valid.token' });

      expect(mockJwt.sign).toHaveBeenCalledTimes(2);
    });
  });
});

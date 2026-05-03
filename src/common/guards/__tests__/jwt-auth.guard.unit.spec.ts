import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '../jwt-auth.guard';

function mockContext(
  headers: Record<string, string>,
  isPublic = false,
): ExecutionContext {
  const reflector = {
    getAllAndOverride: vi.fn().mockReturnValue(isPublic),
  } as any;
  return {
    getHandler: vi.fn(),
    getClass: vi.fn(),
    switchToHttp: () => ({
      getRequest: () => ({ headers }),
    }),
  } as any;
}

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: JwtService;
  let reflector: Reflector;

  beforeEach(() => {
    jwtService = { verify: vi.fn() } as any;
    reflector = { getAllAndOverride: vi.fn().mockReturnValue(false) } as any;
    guard = new JwtAuthGuard(jwtService, reflector);
  });

  it('allows access to public routes', () => {
    reflector.getAllAndOverride = vi.fn().mockReturnValue(true);
    const ctx = mockContext({}, true);
    ctx.getHandler = vi.fn();
    ctx.getClass = vi.fn();
    (guard as any).reflector = reflector;
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('throws when Authorization header is missing', () => {
    const ctx = mockContext({});
    (guard as any).reflector = reflector;
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('throws when Authorization header does not start with Bearer', () => {
    const ctx = mockContext({ authorization: 'Basic abc123' });
    (guard as any).reflector = reflector;
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('throws when token is invalid', () => {
    (jwtService.verify as any).mockImplementation(() => {
      throw new Error('invalid');
    });
    const ctx = mockContext({ authorization: 'Bearer bad.token.here' });
    (guard as any).reflector = reflector;
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('allows access with valid token', () => {
    const payload = { userId: '123', login: 'user', role: 'viewer' };
    (jwtService.verify as any).mockReturnValue(payload);
    const request: any = { headers: { authorization: 'Bearer valid.token' } };
    const ctx = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({ getRequest: () => request }),
    } as any;
    (guard as any).reflector = reflector;
    expect(guard.canActivate(ctx)).toBe(true);
    expect(request.user).toEqual(payload);
  });
});

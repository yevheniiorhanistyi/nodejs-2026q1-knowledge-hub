import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../roles.guard';

function mockContext(user: any): ExecutionContext {
  return {
    getHandler: vi.fn(),
    getClass: vi.fn(),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as any;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = { getAllAndOverride: vi.fn() } as any;
    guard = new RolesGuard(reflector);
  });

  it('allows access when no roles are required', () => {
    (reflector.getAllAndOverride as any).mockReturnValue(null);
    const ctx = mockContext({ role: 'viewer' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows access when required roles is empty array', () => {
    (reflector.getAllAndOverride as any).mockReturnValue([]);
    const ctx = mockContext({ role: 'viewer' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows access when user has required role', () => {
    (reflector.getAllAndOverride as any).mockReturnValue(['admin']);
    const ctx = mockContext({ role: 'admin' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('throws ForbiddenException when user has insufficient role', () => {
    (reflector.getAllAndOverride as any).mockReturnValue(['admin']);
    const ctx = mockContext({ role: 'viewer' });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when user is missing', () => {
    (reflector.getAllAndOverride as any).mockReturnValue(['admin']);
    const ctx = mockContext(null);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});

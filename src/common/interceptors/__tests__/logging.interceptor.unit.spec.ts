import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { LoggingInterceptor } from '../logging.interceptor';

function mockContext(
  method: string,
  url: string,
  body: any = {},
): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ method, url, query: {}, body }),
      getResponse: () => ({ statusCode: 200 }),
    }),
  } as any;
}

function mockHandler(): CallHandler {
  return { handle: () => of({ data: 'ok' }) };
}

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;

  beforeEach(() => {
    interceptor = new LoggingInterceptor();
  });

  it('passes the response through unchanged', async () => {
    const ctx = mockContext('GET', '/article');
    const result = await new Promise((resolve) => {
      interceptor.intercept(ctx, mockHandler()).subscribe(resolve);
    });
    expect(result).toEqual({ data: 'ok' });
  });

  it('redacts password from request body in logs', () => {
    const logSpy = vi.spyOn((interceptor as any).logger, 'log');
    const ctx = mockContext('POST', '/auth/login', {
      login: 'user1',
      password: 'secret',
    });
    interceptor.intercept(ctx, mockHandler()).subscribe();
    const logCall = logSpy.mock.calls[0][0] as string;
    expect(logCall).toContain('[REDACTED]');
    expect(logCall).not.toContain('secret');
  });

  it('redacts refreshToken from request body in logs', () => {
    const logSpy = vi.spyOn((interceptor as any).logger, 'log');
    const ctx = mockContext('POST', '/auth/refresh', {
      refreshToken: 'my.secret.token',
    });
    interceptor.intercept(ctx, mockHandler()).subscribe();
    const logCall = logSpy.mock.calls[0][0] as string;
    expect(logCall).toContain('[REDACTED]');
    expect(logCall).not.toContain('my.secret.token');
  });

  it('logs response status and timing', async () => {
    const logSpy = vi.spyOn((interceptor as any).logger, 'log');
    const ctx = mockContext('GET', '/user');
    await new Promise((resolve) => {
      interceptor.intercept(ctx, mockHandler()).subscribe(resolve);
    });
    const responseLine = logSpy.mock.calls[1][0] as string;
    expect(responseLine).toContain('200');
    expect(responseLine).toContain('GET');
    expect(responseLine).toContain('/user');
  });
});

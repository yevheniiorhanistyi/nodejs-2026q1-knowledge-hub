import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HttpException, HttpStatus } from '@nestjs/common';
import { AllExceptionsFilter } from '../all-exceptions.filter';
import {
  NotFoundError,
  ValidationError,
  ForbiddenError,
  UnauthorizedError,
} from '../../errors/http-errors';

function mockHost(json: ReturnType<typeof vi.fn>) {
  return {
    switchToHttp: () => ({
      getResponse: () => ({
        status: vi.fn().mockReturnValue({ json }),
      }),
      getRequest: () => ({ method: 'GET', url: '/test' }),
    }),
  } as any;
}

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let json: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    json = vi.fn();
  });

  it('handles HttpException with correct status', () => {
    const host = mockHost(json);
    filter.catch(new HttpException('Not found', HttpStatus.NOT_FOUND), host);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404 }),
    );
  });

  it('handles NotFoundError with 404', () => {
    const host = mockHost(json);
    filter.catch(new NotFoundError('Article not found'), host);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 404,
        message: 'Article not found',
      }),
    );
  });

  it('handles ValidationError with 400', () => {
    const host = mockHost(json);
    filter.catch(new ValidationError('Invalid input'), host);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 400 }),
    );
  });

  it('handles UnauthorizedError with 401', () => {
    const host = mockHost(json);
    filter.catch(new UnauthorizedError(), host);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 401 }),
    );
  });

  it('handles ForbiddenError with 403', () => {
    const host = mockHost(json);
    filter.catch(new ForbiddenError(), host);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 403 }),
    );
  });

  it('handles unknown error with 500', () => {
    const host = mockHost(json);
    filter.catch(new Error('something broke'), host);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 500 }),
    );
  });
});

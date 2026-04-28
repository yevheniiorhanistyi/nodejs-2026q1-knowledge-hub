import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request, Response } from 'express';

function sanitizeBody(body: Record<string, unknown>): Record<string, unknown> {
  if (!body || typeof body !== 'object') return body;

  const SENSITIVE_FIELDS = [
    'password',
    'oldPassword',
    'newPassword',
    'refreshToken',
    'accessToken',
  ];
  const sanitized = { ...body };

  for (const field of SENSITIVE_FIELDS) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    const { method, url, query, body } = req;
    const start = Date.now();

    this.logger.log(
      `→ ${method} ${url} | query: ${JSON.stringify(query)} | body: ${JSON.stringify(sanitizeBody(body))}`,
    );

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - start;
        this.logger.log(
          `← ${method} ${url} | ${res.statusCode} | ${duration}ms`,
        );
      }),
    );
  }
}

import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { describe, it, expect } from 'vitest';
import { CreateArticleDto } from '../create-article.dto';
import { ArticleStatus } from '@prisma/client';

describe('CreateArticleDto', () => {
  it('passes with minimal valid data', async () => {
    const dto = plainToInstance(CreateArticleDto, {
      title: 'Test',
      content: 'Body',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('fails when title is missing', async () => {
    const dto = plainToInstance(CreateArticleDto, { content: 'Body' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'title')).toBe(true);
  });

  it('fails when content is missing', async () => {
    const dto = plainToInstance(CreateArticleDto, { title: 'Test' });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'content')).toBe(true);
  });

  it('fails with invalid status enum', async () => {
    const dto = plainToInstance(CreateArticleDto, {
      title: 'Test',
      content: 'Body',
      status: 'invalid_status',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'status')).toBe(true);
  });

  it('passes with valid status enum', async () => {
    const dto = plainToInstance(CreateArticleDto, {
      title: 'Test',
      content: 'Body',
      status: ArticleStatus.draft,
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('fails with invalid authorId UUID', async () => {
    const dto = plainToInstance(CreateArticleDto, {
      title: 'Test',
      content: 'Body',
      authorId: 'not-a-uuid',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'authorId')).toBe(true);
  });

  it('passes with valid UUID authorId', async () => {
    const dto = plainToInstance(CreateArticleDto, {
      title: 'Test',
      content: 'Body',
      authorId: '123e4567-e89b-12d3-a456-426614174000',
    });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});

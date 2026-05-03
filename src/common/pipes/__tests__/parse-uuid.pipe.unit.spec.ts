import { describe, it, expect, beforeEach } from 'vitest';
import { ParseUUIDPipe, BadRequestException } from '@nestjs/common';

describe('ParseUUIDPipe', () => {
  let pipe: ParseUUIDPipe;

  beforeEach(() => {
    pipe = new ParseUUIDPipe();
  });

  it('passes valid UUID v4 through', async () => {
    const uuid = '123e4567-e89b-12d3-a456-426614174000';
    const result = await pipe.transform(uuid, { type: 'param' });
    expect(result).toBe(uuid);
  });

  it('throws BadRequestException for invalid UUID', async () => {
    await expect(
      pipe.transform('not-a-uuid', { type: 'param' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException for empty string', async () => {
    await expect(pipe.transform('', { type: 'param' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws BadRequestException for malformed UUID', async () => {
    await expect(
      pipe.transform('123e4567-e89b-12d3-a456', { type: 'param' }),
    ).rejects.toThrow(BadRequestException);
  });
});

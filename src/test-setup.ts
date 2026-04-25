import 'reflect-metadata';
import { vi } from 'vitest';

vi.mock('@nestjs-cls/transactional', () => ({
  Transactional: () => () => ({}),
}));

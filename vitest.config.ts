import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.unit.spec.ts'],
    setupFiles: ['src/test-setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: [
        'src/main.ts',
        'src/**/*.module.ts',
        'src/**/*.dto.ts',
        'src/**/*.entity.ts',
        'src/**/*.types.ts',
        'src/prisma/**',
        'src/test-setup.ts',
        'src/**/*.controller.ts',
        'src/common/logger/**',
        'src/common/decorators/**',
      ],
      thresholds: {
        lines: 90,
        branches: 85,
      },
      reporter: ['text', 'lcov'],
    },
  },
});

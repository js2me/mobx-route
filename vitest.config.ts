import { ConfigsManager } from 'sborshik/utils';
import { defineLibVitestConfig } from 'sborshik/vite';

export default defineLibVitestConfig(ConfigsManager.create(), {
  test: {
    testTimeout: 5000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    coverage: {
      exclude: ['src/**/*.bench.ts'],
      thresholds: {
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100,
      },
    },
  },
});

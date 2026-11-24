import { ConfigsManager } from 'sborshik/utils';
import { defineLibVitestConfig } from 'sborshik/vite';
import solidPlugin from 'vite-plugin-solid';

export default defineLibVitestConfig(ConfigsManager.create(), {
  plugins: [
    solidPlugin({
      include: [/packages\/solid\/.*\.tsx?$/],
    }),
  ],
  test: {
    testTimeout: 5000,
    hookTimeout: 10000,
    teardownTimeout: 10000,
    coverage: {
      exclude: ['src/**/*.bench.ts'],
    },
  },
});

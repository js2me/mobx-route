import { rm } from 'node:fs/promises';
import { ConfigsManager } from 'sborshik/utils';
import { defineLibViteConfig } from 'sborshik/vite';
import solidPlugin from 'vite-plugin-solid';

export default defineLibViteConfig(ConfigsManager.create(), {
  async customPluginBeforeFinish() {
    // mobx-solid exposes an ESM entry point.
    await Promise.all([
      rm('dist/solid.cjs', { force: true }),
      rm('dist/solid.cjs.map', { force: true }),
    ]);
  },
  plugins: [
    solidPlugin({
      include: [/packages\/solid\/.*\.tsx?$/],
    }),
  ],
});

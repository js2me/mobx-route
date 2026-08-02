import { ConfigsManager } from 'sborshik/utils';
import { defineLibViteConfig } from 'sborshik/vite';
import solidPlugin from 'vite-plugin-solid';

export default defineLibViteConfig(ConfigsManager.create(), {
  plugins: [
    solidPlugin({
      include: [/packages\/solid\/.*\.tsx?$/],
    }),
  ],
});

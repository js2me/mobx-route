import { bench, describe } from 'vitest';
import { VirtualRoute } from './virtual-route.js';

describe('VirtualRoute', () => {
  bench('create virtual route', () => {
    const route = new VirtualRoute();
    route.destroy();
  });

  bench('open and close', async () => {
    const route = new VirtualRoute<{ id: number }>();
    await route.open({ id: 42 });
    await route.close();
    route.destroy();
  });

  bench('update params', async () => {
    const route = new VirtualRoute<{ id: number }>();
    await route.open({ id: 1 });
    await route.open({ id: 2 });
    route.destroy();
  });
});

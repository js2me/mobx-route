import { bench, describe } from 'vitest';
import { createRoute } from '../route/route.js';
import { groupRoutes } from './route-group.js';

describe('RouteGroup', () => {
  bench('create group and resolve index route', () => {
    const group = groupRoutes({
      index: createRoute('/dashboard', { index: true }),
      users: createRoute('/users'),
      settings: createRoute('/settings'),
    });
    group.indexRoute;
  });

  bench('find navigable nested group', () => {
    const group = groupRoutes({
      empty: groupRoutes({
        users: createRoute('/users'),
      }),
      admin: groupRoutes({
        index: createRoute('/admin', { index: true }),
      }),
    });
    group.canNavigate;
  });
});

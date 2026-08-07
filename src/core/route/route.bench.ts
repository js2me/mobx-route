import { createMemoryHistory, createQueryParams } from 'mobx-location-history';
import { afterAll, bench, describe } from 'vitest';
import { Route } from './route.js';

const createRoute = (path: string) => {
  const history = createMemoryHistory({ initialEntries: ['/'] });
  const queryParams = createQueryParams({ history });
  const route = new Route(path, { history, queryParams });
  return { history, route };
};

describe('Route', () => {
  const warmRoute = createRoute('/users/:userId');
  let warmUserId = 0;

  afterAll(() => {
    warmRoute.route.destroy();
    warmRoute.history.destroy();
  });

  bench('create route', () => {
    const { history, route } = createRoute('/users/:userId/posts/:postId');
    route.destroy();
    history.destroy();
  });

  bench('match path with params', () => {
    const { history, route } = createRoute('/users/:userId/posts/:postId');
    route.matchPath('/users/42/posts/7');
    route.destroy();
    history.destroy();
  });

  bench('createUrl with params and query', () => {
    const { history, route } = createRoute('/users/:userId/posts/:postId');
    route.createUrl({ userId: 42, postId: 7 }, { tab: 'comments' });
    route.destroy();
    history.destroy();
  });

  bench('open route', async () => {
    const userId = warmUserId++;
    await warmRoute.route.open(
      { userId },
      { query: { tab: `profile-${userId}` } },
    );
  });

  bench('open route (replace)', async () => {
    const userId = warmUserId++;
    await warmRoute.route.open(
      { userId },
      { replace: true, query: { tab: `profile-${userId}` } },
    );
  });

  bench('open route (string URL)', async () => {
    const userId = warmUserId++;
    await warmRoute.route.open(`/users/${userId}?tab=profile-${userId}`);
  });

  bench('open route (without query)', async () => {
    const userId = warmUserId++;
    await warmRoute.route.open({ userId });
  });
});

import { createMemoryHistory, createQueryParams } from 'mobx-location-history';
import { bench, describe } from 'vitest';
import { createRoute } from '../route/route.js';
import { Router } from './router.js';

const createRouter = () => {
  const history = createMemoryHistory({ initialEntries: ['/'] });
  const queryParams = createQueryParams({ history });
  const routes = {
    home: createRoute('/', { history, queryParams }),
    users: createRoute('/users', { history, queryParams }),
  };
  const router = new Router({ routes, history, queryParams });
  return { history, router };
};

describe('Router', () => {
  bench('create router', () => {
    const { history, router } = createRouter();
    router.location;
    history.destroy();
  });

  bench('navigate with query params', () => {
    const { history, router } = createRouter();
    router.navigate('/users', { query: { page: 2, filter: 'active' } });
    history.destroy();
  });
});

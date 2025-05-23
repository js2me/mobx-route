/* eslint-disable sonarjs/no-dead-store */
/* eslint-disable sonarjs/sonar-no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { createBrowserHistory, History } from 'mobx-location-history';
import { beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest';

import { routeConfig } from '../config/config.js';
import { RouteGroup } from '../route-group/route-group.js';

import { Route } from './route.js';
import { PathParam } from './route.types.js';

export const mockHistory = (history: History) => {
  const spies = {
    push: vi.spyOn(history, 'push'),
    replace: vi.spyOn(history, 'replace'),
  };

  const clearMocks = () => {
    spies.push.mockClear();
    spies.replace.mockClear();
  };

  return {
    ...history,
    spies,
    clearMocks,
  };
};

describe('route', () => {
  const history = mockHistory(createBrowserHistory());

  routeConfig.update({
    history,
  });

  beforeEach(() => {
    history.clearMocks();
  });

  it('empty string', () => {
    const route = new Route('');
    expect(route.isOpened).toBe(true);
  });

  it('/test', () => {
    const route = new Route('/test');
    route.open();
    expect(history.spies.push).toBeCalledWith('/test', null);
  });

  it('/test/:id/:bar{/:bar3}', () => {
    const route = new Route('/test/:id/:bar{/:bar3}');
    route.open({
      id: 1,
      bar: 'barg',
    });
    expect(history.spies.push).toBeCalledWith('/test/1/barg', null);
    expectTypeOf(route.open).toBeFunction();
    expectTypeOf(route.open).parameter(0).toEqualTypeOf<
      | string
      | {
          id: PathParam;
          bar: PathParam;
          bar3?: PathParam;
        }
    >();
  });

  it('/test/*splat', () => {
    const route = new Route('/test/*splat');
    route.open({
      splat: [1, 2, 3],
    });
    expect(history.spies.push).toBeCalledWith('/test/1/2/3', null);
  });

  it('/users{/:id}/delete', () => {
    const route = new Route('/users{/:id}/delete');
    route.open({
      id: 1,
    });
    expect(history.spies.push).toBeCalledWith('/users/1/delete', null);

    history.clearMocks();

    route.open();
    expect(history.spies.push).toBeCalledWith('/users/delete', null);

    history.clearMocks();

    const childRoute = route.extend('/push/:id1{/:bar}');
    childRoute.open({
      id1: 1,
      bar: 2,
      id: 3,
    });
    expect(history.spies.push).toBeCalledWith('/users/3/delete/push/1/2', null);
  });

  it('/posts{/:slug}/*rest', () => {
    const route = new Route('/posts{/:slug}/*rest');
    route.open({
      slug: true,
      rest: [1, 2, 3, 'bar'],
    });
    expect(history.spies.push).toBeCalledWith('/posts/true/1/2/3/bar', null);
    const otherRoute = new Route('/kek/pek');

    expect(otherRoute.isOpened).toBe(false);
    expect(route.isOpened).toBe(true);
    expect({
      path: route.currentPath,
      params: route.params,
    }).toEqual({
      path: '/posts/true/1/2/3/bar',
      params: {
        rest: ['1', '2', '3', 'bar'],
        slug: 'true',
      },
    });
  });

  it('/test/:id/:bar + baseUrl + query params', () => {
    const route = new Route('/test/:id/:bar', { baseUrl: '/mobx-view-model' });
    route.open(
      {
        id: 1,
        bar: 'barg',
      },
      {
        query: { a: 1 },
      },
    );
    expect(history.spies.push).toBeCalledWith(
      '/mobx-view-model/test/1/barg?a=1',
      null,
    );
    expect(route.isOpened).toBe(true);
  });

  it('/test/:id/:bar + baseUrl + query params + (query params tests)', () => {
    const route = new Route('/test/:id/:bar', { baseUrl: '/mobx-view-model' });
    route.open(
      {
        id: 1,
        bar: 'barg',
      },
      {
        query: { a: 1 },
      },
    );
    route.query.update({ a: 3, b: [1, 2, 3] });
    expect(location.search).toBe('?a=3&b=1%2C2%2C3');
    expect(route.query.data).toEqual({ a: '3', b: '1,2,3' });
  });

  it('hierarchy test', () => {
    const routes = {
      private: new RouteGroup({
        index: new Route('/', { index: true }),
        techreview: new Route('/techreview'),
        techreviewTemplates: new Route('/techreview-templates'),
        employee: new Route('/employee'),
        matrices: new Route('/matrices'),
        orgstructure: new Route('/orgstructure'),
        roles: new RouteGroup({
          index: new Route('/roles', { index: true }),
          list: new Route('/roles/list'),
          create: new Route('/roles/create'),
          edit: new Route('/roles/edit/:id'),
        }),
        account: new Route('/account'),
      }),
      notFound: new Route('/not-found'),
      noAccess: new Route('/no-access'),
      login: new Route('/login'),
    };

    expect(routes.private.isOpened).toBe(false);
    expect(routes.private.routes.matrices.isOpened).toBe(false);

    history.push('/matrices', null);
    history.clearMocks();

    expect(routes.private.isOpened).toBe(true);
    expect(routes.private.routes.matrices.isOpened).toBe(true);

    expect(routes.private.routes.techreview.isOpened).toBe(false);

    routes.private.routes.index.open();

    expect(routes.private.isOpened).toBe(true);
    expect(routes.private.routes.index.isOpened).toBe(true);
    expect(routes.private.routes.techreview.isOpened).toBe(false);

    expect(history.spies.push).toBeCalledWith('/', null);
    expect(location.href).toBe('http://localhost:3000/');
    history.clearMocks();
  });

  it('test with root paths (/, "")', () => {
    const routes = {
      home: new Route('/'),
      root: new Route(''),
      projects: new RouteGroup({
        index: new Route('/projects', { index: true }),
        new: new Route('/projects/new'),
        details: new Route('/projects/:projectId'),
      }),
    };

    history.replace('/', null);
    expect(location.href).toBe('http://localhost:3000/');
    expect(routes.home.isOpened).toBe(true);
    expect(routes.root.isOpened).toBe(true);
    expect(routes.projects.routes.index.isOpened).toBe(false);
  });

  it('parent test', () => {
    history.push('/a/b/c', null);

    const routeA = new Route('/a');
    const routeB = routeA.extend('/b');
    const routeC = routeB.extend('/c');

    expect(routeA.hasOpenedChildren).toBe(true);
    expect(routeB.hasOpenedChildren).toBe(true);
    expect(routeC.hasOpenedChildren).toBe(false);

    expect(routeA.isOpened).toBe(false);
    expect(routeB.isOpened).toBe(false);
    expect(routeC.isOpened).toBe(true);
  });
});

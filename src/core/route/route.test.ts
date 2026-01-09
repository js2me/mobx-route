/** biome-ignore-all lint/nursery/noFloatingPromises: <explanation> */

import { when } from 'mobx';
import { createBrowserHistory, type History } from 'mobx-location-history';
import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  it,
  vi,
} from 'vitest';
import { sleep } from 'yummies/async';
import { routeConfig } from '../config/index.js';
import { RouteGroup } from '../route-group/route-group.js';
import { createRoute, Route } from './route.js';
import type { InputPathParam } from './route.types.js';

export const mockHistory = <THistory extends History>(history: THistory) => {
  const spies = {
    push: vi.spyOn(history, 'push' as any),
    replace: vi.spyOn(history, 'replace' as any),
  };

  const resetMock = () => {
    spies.push.mockClear();
    spies.replace.mockClear();
  };

  Object.assign(history, {
    spies,
    resetMock,
  });

  return history as THistory & {
    spies: typeof spies;
    resetMock: () => void;
  };
};

describe('route', () => {
  const history = mockHistory(createBrowserHistory());

  beforeAll(() => {
    routeConfig.update({
      history,
    });
  });

  beforeEach(() => {
    history.replace('/', null);
    globalThis.history.replaceState(null, '', '/');
    window.history.replaceState(null, '', '/');

    history.resetMock();
  });

  it('empty string', async ({ signal }) => {
    const route = new Route('', { abortSignal: signal });
    expect(route.isOpened).toBe(true);
  });

  it('/test', async ({ signal }) => {
    const route = new Route('/test', { abortSignal: signal });
    await route.open();
    expect(history.spies.push).toBeCalledWith('/test', null);
  });

  it('/test/:id/:bar{/:bar3}', async ({ signal }) => {
    const route = new Route('/test/:id/:bar{/:bar3}', { abortSignal: signal });
    await route.open({
      id: 1,
      bar: 'barg',
    });
    expect(history.spies.push).toBeCalledWith('/test/1/barg', null);
    expectTypeOf(route.open).toBeFunction();
    expectTypeOf(route.open).parameter(0).toEqualTypeOf<
      | string
      | {
          id: InputPathParam;
          bar: InputPathParam;
          bar3?: InputPathParam;
        }
    >();
  });

  it('/test/*splat', async ({ signal }) => {
    const route = new Route('/test/*splat', { abortSignal: signal });
    await route.open({
      splat: [1, 2, 3],
    });
    expect(history.spies.push).toBeCalledWith('/test/1/2/3', null);
  });

  it('/users{/:id}/delete', async () => {
    const route = new Route('/users{/:id}/delete');
    await route.open({
      id: 1,
    });
    expect(history.spies.push).toBeCalledWith('/users/1/delete', null);

    history.resetMock();

    await route.open();
    expect(history.spies.push).toBeCalledWith('/users/delete', null);

    history.resetMock();

    const childRoute = route.extend('/push/:id1{/:bar}');
    await childRoute.open({
      id1: 1,
      bar: 2,
      id: 3,
    });
    expect(history.spies.push).toBeCalledWith('/users/3/delete/push/1/2', null);
  });

  it('/posts{/:slug}/*rest', async () => {
    const route = new Route('/posts{/:slug}/*rest');
    await route.open({
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

  it('/test/:id/:bar + baseUrl + query params', async () => {
    const route = new Route('/test/:id/:bar', { baseUrl: '/mobx-view-model' });
    await route.open(
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

  it('/test/:id/:bar + baseUrl + query params + (query params tests)', async () => {
    const route = new Route('/test/:id/:bar', { baseUrl: '/mobx-view-model' });
    await route.open(
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

  it('hierarchy test', async () => {
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

    expect(history.location.pathname).toBe('/');
    expect(routes.private.isOpened).toBe(true); // because location.pathname === '/' and private has index '/' route
    expect(routes.private.routes.matrices.isOpened).toBe(false);

    history.push('/matrices', null);
    history.resetMock();

    expect(routes.private.isOpened).toBe(true);
    expect(routes.private.routes.matrices.isOpened).toBe(true);

    expect(routes.private.routes.techreview.isOpened).toBe(false);

    await routes.private.routes.index.open();

    expect(routes.private.isOpened).toBe(true);
    expect(routes.private.routes.index.isOpened).toBe(true);
    expect(routes.private.routes.techreview.isOpened).toBe(false);

    expect(history.spies.push).toBeCalledWith('/', null);
    expect(location.href).toBe('http://localhost:3000/');
    history.resetMock();
  });

  it('test with root paths (/, "")', async () => {
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

  it('parent test', async () => {
    history.push('/a/b/c', null);

    const routeA = new Route('/a');
    const routeB = routeA.extend('/b');
    const routeC = routeB.extend('/c');

    expect(routeA.hasOpenedChildren).toBe(true);
    expect(routeB.hasOpenedChildren).toBe(true);
    expect(routeC.hasOpenedChildren).toBe(false);

    expect(routeA.isOpened).toBe(true);
    expect(routeB.isOpened).toBe(true);
    expect(routeC.isOpened).toBe(true);
  });

  it('test param typings (no options)', () => {
    const foo = new Route<
      '/foo/:bar/:baz',
      { bar: number; baz: string; bad: string },
      { memData: { bar: number; baz: string; bad: string } }
    >('/foo/:bar/:baz', {});

    expectTypeOf(foo.open).toBeFunction();
    expectTypeOf(foo.open)
      .parameter(0)
      .toEqualTypeOf<{ bar: number; baz: string; bad: string } | string>();

    expectTypeOf(foo.params).toEqualTypeOf<null | {
      memData: { bar: number; baz: string; bad: string };
    }>();

    expect(foo).toBeDefined();
  });

  it('test param typings (with options)', () => {
    const foo = new Route('/foo/:bar/:baz', {
      params: (_params) => {
        return {
          bad: 1,
        };
      },
    });

    expectTypeOf(foo.open).toBeFunction();
    expectTypeOf(foo.open)
      .parameter(0)
      .toEqualTypeOf<{ bar: InputPathParam; baz: InputPathParam } | string>();

    expectTypeOf(foo.params).toEqualTypeOf<null | {
      bad: number;
    }>();

    expect(foo).toBeDefined();
  });

  it('test customized param typings', () => {
    const foo = new Route<'/', { foo: string }>('/', {});

    expectTypeOf(foo.open).toBeFunction();
    expectTypeOf(foo.open)
      .parameter(0)
      .toEqualTypeOf<{ foo: string } | string>();

    expectTypeOf(foo.params).toEqualTypeOf<null | {}>();

    expect(foo).toBeDefined();
  });

  it('test mergeQuery', async () => {
    const route = new Route('/foo/bar/baz');
    const route2 = new Route('/asdfdsafdsa');
    const route3 = new Route('/route3');

    await route.open(null, { query: { a: 1, b: 2, c: 3 } });

    expect(history.spies.push).toHaveBeenNthCalledWith(
      1,
      '/foo/bar/baz?a=1&b=2&c=3',
      null,
    );
    expect(history.location.search).toBe('?a=1&b=2&c=3');

    await route2.open(null, {
      query: { c: 4, d: 4, e: 5, f: 6 },
      mergeQuery: true,
    });

    expect(history.spies.push).toHaveBeenNthCalledWith(
      2,
      '/asdfdsafdsa?a=1&b=2&c=4&d=4&e=5&f=6',
      null,
    );
    expect(history.location.search).toBe('?a=1&b=2&c=4&d=4&e=5&f=6');
    expect(route2.query.data).toStrictEqual({
      a: '1',
      b: '2',
      c: '4',
      d: '4',
      e: '5',
      f: '6',
    });

    await route3.open(null, {
      mergeQuery: true,
    });

    expect(history.spies.push).toHaveBeenNthCalledWith(
      3,
      '/route3?a=1&b=2&c=4&d=4&e=5&f=6',
      null,
    );
    expect(history.location.search).toBe('?a=1&b=2&c=4&d=4&e=5&f=6');
    expect(route3.query.data).toStrictEqual({
      a: '1',
      b: '2',
      c: '4',
      d: '4',
      e: '5',
      f: '6',
    });

    history.resetMock();
  });

  it('nested path routes', async () => {
    const route = new Route('/foo');
    const route2 = route.extend('/bar');

    await route2.open();

    expect(route.isOpened).toBe(true);
    expect(route2.isOpened).toBe(true);
    expect(history.location.pathname).toBe('/foo/bar');
  });

  it('beforeOpen should work', async () => {
    const beforeOpenFn = vi.fn();

    const route = new Route('/foo', {
      beforeOpen: async (...args) => {
        await sleep(500);
        beforeOpenFn(...args);
      },
    });

    expect(history.location.pathname).toBe('/');

    history.push('/foo');
    expect(history.location.pathname).toBe('/foo');

    expect(route.isOpened).toBe(false);

    await when(() => route.isOpened);

    expect(route.isOpened).toBe(true);
    expect(beforeOpenFn).toBeCalledTimes(1);
    expect(beforeOpenFn).toBeCalledWith({
      params: {},
      query: {},
      state: null,
      url: '/foo',
      preferSkipHistoryUpdate: true,
    });

    expect(history.location.pathname).toBe('/foo');
  });

  it('beforeOpen should be able to reject opening route', async () => {
    const route = new Route('/foo', {
      beforeOpen: async () => {
        await sleep(500);
        return false;
      },
    });

    expect(history.location.pathname).toBe('/');

    history.push('/foo');

    expect(history.location.pathname).toBe('/foo');

    expect(route.isOpened).toBe(false);

    expect(route.isOpened).toBe(false);
    expect(history.location.pathname).toBe('/foo');
  });

  it('beforeOpen should be able to redirect to another route', async ({
    signal,
  }) => {
    vi.useFakeTimers();

    const route = new Route('/foo', {
      beforeOpen: async () => {
        await sleep(500);
        return {
          url: '/baz',
          replace: true,
        };
      },
      abortSignal: signal,
    });

    expect(history.location.pathname).toBe('/');

    history.push('/foo');

    expect(history.location.pathname).toBe('/foo');

    expect(route.isOpened).toBe(false);

    await vi.runAllTimersAsync();

    expect(route.isOpened).toBe(false);

    expect(history.location.pathname).toBe('/baz');

    vi.useRealTimers();
  });

  it('should be called afterOpen if route is opened at start', async () => {
    await sleep(1000);

    history.push('/foo?modal=new-thing');
    history.push('/foo?modal=new-thing');
    history.push('/foo?modal=new-thing');
    history.push('/foo?modal=new-thing');
    history.push('/foo?modal=new-thing');
    history.push('/foo?modal=new-thing');
    history.push('/foo?modal=new-thing');
    history.push('/foo?modal=new-thing');
    history.push('/foo?modal=new-thing');

    const afterOpenFn = vi.fn();

    const route = createRoute('/foo', {
      afterOpen: afterOpenFn,
    });

    history.push('/foo?modal=new-thing');
    history.push('/foo?modal=new-thing');
    history.push('/foo?modal=new-thing');

    await sleep(10);

    expect(route.isOpened).toBe(true);
    expect(route.isOpening).toBe(false);
    expect(afterOpenFn).toBeCalledTimes(1);
  });

  it('two routes opens should not affect each other', async () => {
    const rout1 = createRoute('/foo');
    const rout2 = createRoute('/bar');

    await rout1.open();
    await rout2.open();

    expect(rout1.isOpened).toBe(false);
    expect(rout2.isOpened).toBe(true);

    await rout2.open();
    await rout1.open();

    expect(rout1.isOpened).toBe(true);
    expect(rout2.isOpened).toBe(false);
  });

  // Test 1: Testing route with custom checkOpened function
  it('should respect custom checkOpened function', async () => {
    const route = new Route('/test/:id', {
      checkOpened: (parsedData) => {
        return parsedData.params.id === '123';
      },
    });

    // Should not be opened with wrong ID
    history.push('/test/456');
    expect(route.isOpened).toBe(false);

    // Should be opened with correct ID
    history.push('/test/123');
    expect(route.isOpened).toBe(true);
  });

  // Test 2: Testing route with fallbackPath
  it('should use fallbackPath when compilation fails', async () => {
    const route = new Route('/test/:id', {
      fallbackPath: '/fallback',
    });

    // This should trigger the fallback path since we're passing invalid params
    const spyPush = vi.spyOn(history, 'push');

    await route.open({ id: null }); // null should cause compilation issue

    expect(spyPush).toHaveBeenCalledWith('/fallback', null);
  });

  // Test 3: Testing route with hash routing
  it('should handle hash routing correctly', async () => {
    const route = new Route('/hash', { hash: true });

    // Navigate to hash route
    history.push('#/hash');

    expect(route.isOpened).toBe(true);
    expect(route.currentPath).toBe('/hash');
  });

  // Test 4: Testing route with exact matching
  it('should respect exact matching flag', async () => {
    const route = new Route('/test', { exact: true });

    // Should not match /testing
    history.push('/testing');
    expect(route.isOpened).toBe(false);

    // Should match /test exactly
    history.push('/test');
    expect(route.isOpened).toBe(true);
  });

  // Test 5: Testing route with custom createUrl function
  it('should use custom createUrl function', async () => {
    const customCreateUrl = vi.fn((params, query) => {
      return {
        ...params,
        baseUrl: '/custom',
        params: { ...params.params, customParam: 'value' },
      };
    });

    const route = new Route('/test/:id', {
      createUrl: customCreateUrl,
    });

    const url = route.createUrl({ id: '123' });

    expect(customCreateUrl).toHaveBeenCalled();
    expect(url).toContain('/custom/test/123');
  });

  // Test 6: Testing route with afterClose callback
  it('should call afterClose when route closes', async () => {
    const afterCloseFn = vi.fn();

    const route = new Route('/test', {
      afterClose: afterCloseFn,
    });

    // Open the route
    await route.open();
    expect(route.isOpened).toBe(true);

    // Change to a different route to trigger close
    history.push('/other');

    // Wait a bit for the close to happen
    await sleep(10);

    expect(afterCloseFn).toHaveBeenCalled();
  });

  // Test 7: Testing route with abort controller
  it('should properly handle abort signal', async () => {
    const abortController = new AbortController();

    const route = new Route('/test', {
      abortSignal: abortController.signal,
    });

    // Abort the controller
    abortController.abort();

    // Try to open the route - should not succeed
    await route.open();

    // We can't directly access status, but we can verify it didn't open
    expect(route.isOpened).toBe(false);
  });

  // Test 8: Testing route with complex nested children
  it('should handle complex nested route hierarchy', async () => {
    const parent = new Route('/admin');
    const child1 = parent.extend('/users');
    const child2 = parent.extend('/settings');
    const grandchild = child1.extend('/profile/:id');

    // Open parent
    await parent.open();
    expect(parent.isOpened).toBe(true);
    expect(child1.isOpened).toBe(false);
    expect(child2.isOpened).toBe(false);
    expect(grandchild.isOpened).toBe(false);

    // Open child1
    await child1.open();
    expect(parent.isOpened).toBe(true);
    expect(child1.isOpened).toBe(true);
    expect(child2.isOpened).toBe(false);
    expect(grandchild.isOpened).toBe(false);

    // Open grandchild
    await grandchild.open({ id: '123' });
    expect(parent.isOpened).toBe(true);
    expect(child1.isOpened).toBe(true);
    expect(child2.isOpened).toBe(false);
    expect(grandchild.isOpened).toBe(true);
  });

  // Test 9: Testing route with query parameter merging behavior
  it('should properly merge query parameters with different scenarios', async () => {
    const route = new Route('/test');

    // Open with initial query
    await route.open(null, { query: { a: 1, b: 2 } });

    expect(history.locationUrl).toBe('/test?a=1&b=2');

    // Open with mergeQuery: true (should preserve previous query)
    await route.open(null, {
      query: { c: 3 },
      mergeQuery: true,
    });
    expect(history.locationUrl).toBe('/test?a=1&b=2&c=3');

    // Open with mergeQuery: false (should not merge)
    await route.open(null, {
      query: { d: 4 },
      mergeQuery: false,
    });
    expect(history.locationUrl).toBe('/test?d=4');
  });
});

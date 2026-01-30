/** biome-ignore-all lint/nursery/noFloatingPromises: <explanation> */

import { observable, when } from 'mobx';
import {
  createBrowserHistory,
  createHashHistory,
  createQueryParams,
  type History,
} from 'mobx-location-history';
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
  const originPush = history.push.bind(history);
  const originReplace = history.replace.bind(history);

  const pushSpy = vi.fn(originPush);
  const replaceSpy = vi.fn(originReplace);

  const resetMock = () => {
    pushSpy.mockReset();
    replaceSpy.mockReset();
  };

  Object.assign(history, {
    push: pushSpy,
    replace: replaceSpy,
    resetMock,
  });

  return history as THistory & {
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
    expect(history.push).toBeCalledWith('/test', null);
  });

  it('/test/:id/:bar{/:bar3}', async ({ signal }) => {
    const route = new Route('/test/:id/:bar{/:bar3}', { abortSignal: signal });
    await route.open({
      id: 1,
      bar: 'barg',
    });
    expect(history.push).toBeCalledWith('/test/1/barg', null);
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
    expect(history.push).toBeCalledWith('/test/1/2/3', null);
  });

  it('/users{/:id}/delete', async () => {
    const route = new Route('/users{/:id}/delete');
    await route.open({
      id: 1,
    });
    expect(history.push).toBeCalledWith('/users/1/delete', null);

    history.resetMock();

    await route.open();
    expect(history.push).toBeCalledWith('/users/delete', null);

    history.resetMock();

    const childRoute = route.extend('/push/:id1{/:bar}');
    await childRoute.open({
      id1: 1,
      bar: 2,
      id: 3,
    });
    expect(history.push).toBeCalledWith('/users/3/delete/push/1/2', null);
  });

  it('/posts{/:slug}/*rest', async () => {
    const route = new Route('/posts{/:slug}/*rest');
    await route.open({
      slug: true,
      rest: [1, 2, 3, 'bar'],
    });
    expect(history.push).toBeCalledWith('/posts/true/1/2/3/bar', null);
    const otherRoute = new Route('/kek/pek');

    expect(otherRoute.isOpened).toBe(false);
    expect(route.isOpened).toBe(true);
    expect({
      path: route.path,
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
    expect(history.push).toBeCalledWith(
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
    // because location.pathname === '/' and private has index '/' route
    expect(routes.private.isOpened).toBe(true);
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

    expect(history.push).toBeCalledWith('/', null);
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

    expect(history.push).toHaveBeenNthCalledWith(
      1,
      '/foo/bar/baz?a=1&b=2&c=3',
      null,
    );
    expect(history.location.search).toBe('?a=1&b=2&c=3');

    await route2.open(null, {
      query: { c: 4, d: 4, e: 5, f: 6 },
      mergeQuery: true,
    });

    expect(history.push).toHaveBeenNthCalledWith(
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

    expect(history.push).toHaveBeenNthCalledWith(
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

    const beforeOpenCall = vi.fn();

    const route = new Route('/foo', {
      beforeOpen: async () => {
        await sleep(500);
        beforeOpenCall();
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

    expect(beforeOpenCall).toBeCalledTimes(1);
  });

  it('should not call beforeOpen twice after manual open', async () => {
    const beforeOpen = vi.fn();
    const route = new Route('/foo', {
      beforeOpen,
    });

    await route.open();
    await sleep(10);

    expect(beforeOpen).toHaveBeenCalledTimes(1);
  });

  it('should allow path-based open after manual open', async () => {
    const beforeOpen = vi.fn();
    const route = new Route('/foo', {
      beforeOpen,
    });

    await route.open();
    await sleep(10);

    beforeOpen.mockClear();

    history.push('/bar');
    await sleep(10);

    history.push('/foo');
    await sleep(10);

    expect(beforeOpen).toHaveBeenCalledTimes(1);
  });

  it('should allow path-based open after manual open rejection', async () => {
    let isFirstCall = true;
    const beforeOpen = vi.fn(() => {
      if (isFirstCall) {
        isFirstCall = false;
        return false;
      }
    });
    const route = new Route('/foo', {
      beforeOpen,
    });

    await route.open();
    await sleep(10);

    expect(route.isOpened).toBe(false);
    expect(beforeOpen).toHaveBeenCalledTimes(1);

    history.push('/foo');
    await sleep(10);

    expect(beforeOpen).toHaveBeenCalledTimes(2);
    expect(route.isOpened).toBe(true);
  });

  it('should keep home opened after manual and link navigation (hash)', async () => {
    const hashHistory = mockHistory(createHashHistory());
    const hashQuery = createQueryParams({ history: hashHistory });

    const routeConfigWithHash = {
      exact: true,
      history: hashHistory,
      queryParams: hashQuery,
    };

    const aboutRoute = createRoute('/about', routeConfigWithHash);
    const homeRoute = createRoute('/', routeConfigWithHash);
    const quizRoute = createRoute('/quiz', routeConfigWithHash);

    hashHistory.replace('/', null);

    await quizRoute.open();
    await homeRoute.open(null, { replace: true });

    hashHistory.push('/about', null);
    await sleep(10);

    hashHistory.push('/', null);
    await sleep(10);

    expect(homeRoute.isOpened).toBe(true);
    expect(aboutRoute.isOpened).toBe(false);
    expect(quizRoute.isOpened).toBe(false);
  });

  it('should keep quiz opened after link chain and manual quiz open', async () => {
    const homeRoute = createRoute('/', { exact: true });
    const quizRoute = createRoute('/quiz', { exact: true });
    const aboutRoute = createRoute('/about', { exact: true });

    history.push('/');
    await sleep(10);

    history.push('/');
    await sleep(10);

    history.push('/quiz');
    await sleep(10);

    history.push('/about');
    await sleep(10);

    await quizRoute.open();
    await when(() => quizRoute.isOpened);

    expect(quizRoute.isOpened).toBe(true);
    expect(homeRoute.isOpened).toBe(false);
    expect(aboutRoute.isOpened).toBe(false);
  });

  it('should open home after manual home following link chain', async () => {
    const homeRoute = createRoute('/', { exact: true });
    const quizRoute = createRoute('/quiz', { exact: true });
    const aboutRoute = createRoute('/about', { exact: true });

    history.push('/');
    await sleep(10);

    history.push('/quiz');
    await sleep(10);

    history.push('/about');
    await sleep(10);

    await homeRoute.open();
    await sleep(10);

    expect(homeRoute.isOpened).toBe(true);
    expect(quizRoute.isOpened).toBe(false);
    expect(aboutRoute.isOpened).toBe(false);
    expect(homeRoute.isOpening).toBe(false);
    expect(quizRoute.isOpening).toBe(false);
    expect(aboutRoute.isOpening).toBe(false);
  });

  it('should open home after manual quiz then link home', async () => {
    const homeRoute = createRoute('/', { exact: true });
    const quizRoute = createRoute('/quiz', { exact: true });
    const aboutRoute = createRoute('/about', { exact: true });

    history.push('/');
    await sleep(10);

    await quizRoute.open();
    await sleep(10);
    expect(quizRoute.isOpening).toBe(false);

    history.push('/');
    await sleep(10);
    expect(homeRoute.isOpening).toBe(false);

    expect(homeRoute.isOpened).toBe(true);
    expect(quizRoute.isOpened).toBe(false);
    expect(aboutRoute.isOpened).toBe(false);
    expect(homeRoute.isOpening).toBe(false);
    expect(quizRoute.isOpening).toBe(false);
    expect(aboutRoute.isOpening).toBe(false);
  });

  it('should open home after manual replace', async () => {
    const homeRoute = createRoute('/', { exact: true });
    const quizRoute = createRoute('/quiz', { exact: true });
    const aboutRoute = createRoute('/about', { exact: true });

    history.push('/');
    await sleep(10);
    expect(homeRoute.isOpening).toBe(false);

    history.push('/quiz');
    await sleep(10);
    expect(quizRoute.isOpening).toBe(false);

    await homeRoute.open(null, { replace: true });
    await sleep(10);
    expect(homeRoute.isOpening).toBe(false);

    expect(homeRoute.isOpened).toBe(true);
    expect(quizRoute.isOpened).toBe(false);
    expect(aboutRoute.isOpened).toBe(false);
    expect(homeRoute.isOpening).toBe(false);
    expect(quizRoute.isOpening).toBe(false);
    expect(aboutRoute.isOpening).toBe(false);
  });

  it('should open about after manual quiz and link about', async () => {
    const homeRoute = createRoute('/', { exact: true });
    const quizRoute = createRoute('/quiz', { exact: true });
    const aboutRoute = createRoute('/about', { exact: true });

    history.push('/');
    await sleep(10);
    expect(homeRoute.isOpening).toBe(false);

    await quizRoute.open();
    await sleep(10);
    expect(quizRoute.isOpening).toBe(false);

    history.push('/about');
    await sleep(10);
    expect(aboutRoute.isOpening).toBe(false);

    expect(aboutRoute.isOpened).toBe(true);
    expect(homeRoute.isOpened).toBe(false);
    expect(quizRoute.isOpened).toBe(false);
    expect(aboutRoute.isOpening).toBe(false);
    expect(homeRoute.isOpening).toBe(false);
    expect(quizRoute.isOpening).toBe(false);
  });

  it('should keep quiz opened after manual quiz on same path', async () => {
    const homeRoute = createRoute('/', { exact: true });
    const quizRoute = createRoute('/quiz', { exact: true });
    const aboutRoute = createRoute('/about', { exact: true });

    history.push('/');
    await sleep(10);

    history.push('/quiz');
    await sleep(10);

    await quizRoute.open();
    await sleep(10);

    expect(quizRoute.isOpened).toBe(true);
    expect(homeRoute.isOpened).toBe(false);
    expect(aboutRoute.isOpened).toBe(false);
    expect(quizRoute.isOpening).toBe(false);
    expect(homeRoute.isOpening).toBe(false);
    expect(aboutRoute.isOpening).toBe(false);
  });

  it('should open quiz after link replace and manual string open', async () => {
    const homeRoute = createRoute('/', { exact: true });
    const quizRoute = createRoute('/quiz', { exact: true });
    const aboutRoute = createRoute('/about', { exact: true });

    history.push('/');
    await sleep(10);

    history.replace('/quiz', null);
    await sleep(10);

    history.push('/about');
    await sleep(10);

    await quizRoute.open('/quiz?mode=fast');
    await sleep(10);

    expect(quizRoute.isOpened).toBe(true);
    expect(homeRoute.isOpened).toBe(false);
    expect(aboutRoute.isOpened).toBe(false);
    expect(quizRoute.isOpening).toBe(false);
    expect(homeRoute.isOpening).toBe(false);
    expect(aboutRoute.isOpening).toBe(false);
  });

  it('should open about after manual home replace and link about', async () => {
    const homeRoute = createRoute('/', { exact: true });
    const quizRoute = createRoute('/quiz', { exact: true });
    const aboutRoute = createRoute('/about', { exact: true });

    history.push('/');
    await sleep(10);

    await quizRoute.open();
    await sleep(10);

    await homeRoute.open(null, { replace: true });
    await sleep(10);

    history.push('/about?from=home');
    await sleep(10);

    expect(aboutRoute.isOpened).toBe(true);
    expect(homeRoute.isOpened).toBe(false);
    expect(quizRoute.isOpened).toBe(false);
    expect(aboutRoute.isOpening).toBe(false);
    expect(homeRoute.isOpening).toBe(false);
    expect(quizRoute.isOpening).toBe(false);
  });

  it('should open home after manual quiz and history replace home', async () => {
    const homeRoute = createRoute('/', { exact: true });
    const quizRoute = createRoute('/quiz', { exact: true });
    const aboutRoute = createRoute('/about', { exact: true });

    history.push('/about');
    await sleep(10);

    await quizRoute.open();
    await sleep(10);

    history.replace('/', null);
    await sleep(10);

    expect(homeRoute.isOpened).toBe(true);
    expect(quizRoute.isOpened).toBe(false);
    expect(aboutRoute.isOpened).toBe(false);
    expect(homeRoute.isOpening).toBe(false);
    expect(quizRoute.isOpening).toBe(false);
    expect(aboutRoute.isOpening).toBe(false);
  });

  it('should open quiz after sequential manual opens', async () => {
    const homeRoute = createRoute('/', { exact: true });
    const quizRoute = createRoute('/quiz', { exact: true });
    const aboutRoute = createRoute('/about', { exact: true });

    history.push('/');
    await sleep(10);

    await homeRoute.open();
    await sleep(10);

    await quizRoute.open();
    await sleep(10);

    expect(quizRoute.isOpened).toBe(true);
    expect(homeRoute.isOpened).toBe(false);
    expect(aboutRoute.isOpened).toBe(false);
    expect(quizRoute.isOpening).toBe(false);
    expect(homeRoute.isOpening).toBe(false);
    expect(aboutRoute.isOpening).toBe(false);
  });

  it('should open quiz after manual open from about link', async () => {
    const homeRoute = createRoute('/', { exact: true });
    const quizRoute = createRoute('/quiz', { exact: true });
    const aboutRoute = createRoute('/about', { exact: true });

    history.push('/');
    await sleep(10);

    history.push('/about');
    await sleep(10);

    await quizRoute.open();
    await when(() => quizRoute.isOpened);

    expect(quizRoute.isOpened).toBe(true);
    expect(homeRoute.isOpened).toBe(false);
    expect(aboutRoute.isOpened).toBe(false);
    expect(quizRoute.isOpening).toBe(false);
    expect(homeRoute.isOpening).toBe(false);
    expect(aboutRoute.isOpening).toBe(false);
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

  it('should set isOpening immediately for manual navigation', async () => {
    vi.useFakeTimers();

    const route = new Route('/opening', {
      beforeOpen: async () => {
        await sleep(50);
      },
    });

    const openPromise = route.open();

    expect(route.isOpening).toBe(true);
    expect(route.isOpened).toBe(false);

    await vi.runAllTimersAsync();
    await openPromise;

    expect(route.isOpening).toBe(false);
    expect(route.isOpened).toBe(true);

    vi.useRealTimers();
  });

  it('should set isOpening immediately for history navigation', async () => {
    vi.useFakeTimers();

    const route = new Route('/auto-opening', {
      beforeOpen: async () => {
        await sleep(50);
      },
    });

    history.push('/auto-opening');

    expect(route.isOpening).toBe(true);
    expect(route.isOpened).toBe(false);

    await vi.runAllTimersAsync();

    expect(route.isOpening).toBe(false);
    expect(route.isOpened).toBe(true);

    vi.useRealTimers();
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

  it('should respect custom checkOpened function', async () => {
    const route = new Route('/test/:id', {
      checkOpened: (parsedData) => {
        return parsedData.params.id === '123';
      },
    });

    history.push('/test/456');
    expect(route.isOpened).toBe(false);

    history.push('/test/123');
    expect(route.isOpened).toBe(true);
  });

  it('should use fallbackPath when compilation fails', async () => {
    const route = new Route('/test/:id', {
      fallbackPath: '/fallback',
    });

    // null should cause compilation issue
    await route.open({ id: null });

    expect(history.push).toHaveBeenCalledWith('/fallback', null);
  });

  it('should handle hash routing correctly', async () => {
    const route = new Route('/hash', { hash: true });

    history.push('#/hash');

    expect(route.isOpened).toBe(true);
    expect(route.path).toBe('/hash');
  });

  it('should respect exact matching flag', async () => {
    const route = new Route('/test', { exact: true });

    history.push('/testing');
    expect(route.isOpened).toBe(false);

    history.push('/test');
    expect(route.isOpened).toBe(true);
  });

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

  it('should call afterClose when route closes', async () => {
    const afterCloseFn = vi.fn();

    const route = new Route('/test', {
      afterClose: afterCloseFn,
    });

    await route.open();
    expect(route.isOpened).toBe(true);

    history.push('/other');

    await sleep(10);

    expect(afterCloseFn).toHaveBeenCalled();
  });

  it('should properly handle abort signal', async () => {
    const abortController = new AbortController();

    const route = new Route('/test', {
      abortSignal: abortController.signal,
    });

    abortController.abort();

    await route.open();

    expect(route.isOpened).toBe(false);
  });

  it('should handle complex nested route hierarchy', async () => {
    const parent = new Route('/admin');
    const child1 = parent.extend('/users');
    const child2 = parent.extend('/settings');
    const grandchild = child1.extend('/profile/:id');

    await parent.open();
    expect(parent.isOpened).toBe(true);
    expect(child1.isOpened).toBe(false);
    expect(child2.isOpened).toBe(false);
    expect(grandchild.isOpened).toBe(false);

    await child1.open();
    expect(parent.isOpened).toBe(true);
    expect(child1.isOpened).toBe(true);
    expect(child2.isOpened).toBe(false);
    expect(grandchild.isOpened).toBe(false);

    await grandchild.open({ id: '123' });
    expect(parent.isOpened).toBe(true);
    expect(child1.isOpened).toBe(true);
    expect(child2.isOpened).toBe(false);
    expect(grandchild.isOpened).toBe(true);
  });

  it('should properly merge query parameters with different scenarios', async () => {
    const route = new Route('/test');

    await route.open(null, { query: { a: 1, b: 2 } });

    expect(history.locationUrl).toBe('/test?a=1&b=2');

    await route.open(null, {
      query: { c: 3 },
      mergeQuery: true,
    });
    expect(history.locationUrl).toBe('/test?a=1&b=2&c=3');

    await route.open(null, {
      query: { d: 4 },
      mergeQuery: false,
    });
    expect(history.locationUrl).toBe('/test?d=4');
  });

  it('should skip reflect opening state because route do not have any async ops', async () => {
    const route = new Route('/test');

    expect(route.isOpening).toBe(false);

    const openPromise = route.open();

    expect(route.isOpening).toBe(false);
    // because route do not have any async ops
    expect(route.isOpened).toBe(true);

    await openPromise;

    expect(route.isOpening).toBe(false);
    expect(route.isOpened).toBe(true);
  });

  it('should reflect opening state because route have any async ops', async () => {
    const route = new Route('/test', {
      beforeOpen: async () => {},
    });

    expect(route.isOpening).toBe(false);

    const openPromise = route.open();

    expect(route.isOpening).toBe(true);
    expect(route.isOpened).toBe(false);

    await openPromise;

    expect(route.isOpening).toBe(false);
    expect(route.isOpened).toBe(true);
  });

  it('should correctly identify opened children in complex hierarchy', async () => {
    const parent = new Route('/admin');
    const child1 = parent.extend('/users');
    const child2 = parent.extend('/settings');
    const grandchild1 = child1.extend('/profile');

    expect(parent.hasOpenedChildren).toBe(false);
    expect(child1.hasOpenedChildren).toBe(false);
    expect(child2.hasOpenedChildren).toBe(false);

    await parent.open();

    await child1.open();
    expect(parent.hasOpenedChildren).toBe(true);

    await grandchild1.open();
    expect(parent.hasOpenedChildren).toBe(true);
    expect(child1.hasOpenedChildren).toBe(true);
  });

  it('should correctly transform params with custom params function', async () => {
    const route = new Route('/test/:id', {
      params: (parsedParams) => {
        return {
          transformedId: parseInt(parsedParams.id) * 2,
          originalId: parsedParams.id,
        };
      },
    });

    await route.open({ id: '5' });

    expect(route.params).toEqual({
      transformedId: 10,
      originalId: '5',
    });
  });

  it('should correctly return current path for different route configurations', async () => {
    const regularRoute = new Route('/test/:id');
    await regularRoute.open({ id: '123' });
    expect(regularRoute.path).toBe('/test/123');

    const hashRoute = new Route('/hash', { hash: true });
    history.push('#/hash');
    expect(hashRoute.path).toBe('/hash');

    const baseUrlRoute = new Route('/path', { baseUrl: '/app' });
    history.push('/app/path');
    expect(baseUrlRoute.path).toBe('/path');
  });

  it('should correctly generate URLs with various parameter combinations', async () => {
    const route = new Route('/test/:id/:name');

    const url1 = route.createUrl({ id: '123', name: 'john' });
    expect(url1).toBe('/test/123/john');

    const url2 = route.createUrl(
      { id: '123', name: 'john' },
      { filter: 'active' },
    );
    expect(url2).toBe('/test/123/john?filter=active');

    const url3 = route.createUrl(
      { id: '123', name: 'john' },
      { filter: 'active' },
      true,
    );
    expect(url3).toBe('/test/123/john?filter=active');
  });

  it('should respect global mergeQuery setting of true', async () => {
    routeConfig.update({
      mergeQuery: true,
    });

    const route = new Route('/test');

    await route.open(null, { query: { a: 1, b: 2 } });
    expect(history.location.pathname).toBe('/test');
    expect(history.location.search).toBe('?a=1&b=2');

    await route.open(null, { query: { c: 3 } });
    expect(history.location.search).toBe('?a=1&b=2&c=3');

    routeConfig.update({
      mergeQuery: false,
    });
  });

  it('should handle baseUrl that ends with slash correctly', async () => {
    const route = new Route('/test', { baseUrl: '/app/' });

    await route.open();
    expect(history.push).toHaveBeenCalledWith('/app/test', null);
  });

  it.skip('protected route (by checkOpened)', async () => {
    vi.useFakeTimers();

    await vi.runAllTimersAsync();

    const protectBox = observable.box(false);

    const route = createRoute('/foo/bar', {
      checkOpened: () => protectBox.get(),
    });

    history.push('/foo/bar');

    await vi.runAllTimersAsync();

    expect(history.locationUrl).toBe('/foo/bar');
    expect(route.isOpened).toBe(false);

    protectBox.set(true);

    expect(history.locationUrl).toBe('/foo/bar');
    expect(route.isOpened).toBe(true);

    vi.useRealTimers();
  });

  it.skip('protected route (by beforeOpen)', async () => {
    vi.useFakeTimers();

    await vi.runAllTimersAsync();

    const protectBox = observable.box(false);

    const route = createRoute('/foo/bar', {
      beforeOpen: () => protectBox.get(),
    });

    history.push('/foo/bar');

    await vi.runAllTimersAsync();

    expect(history.locationUrl).toBe('/foo/bar');
    expect(route.isOpened).toBe(false);

    protectBox.set(true);

    expect(history.locationUrl).toBe('/foo/bar');
    // because beforeOpen returns false
    // and it calls once
    expect(route.isOpened).toBe(false);

    vi.useRealTimers();
  });
});

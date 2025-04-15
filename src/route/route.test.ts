import { MobxHistory, MobxLocation } from 'mobx-location-history';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Route } from './route.js';

class MobxHistoryMock extends MobxHistory {
  pushStateSpy = vi.fn();
  replaceStateSpy = vi.fn();

  pushState(
    data: any,
    unused: string,
    url?: string | URL | null | undefined,
  ): void {
    this.pushStateSpy(data, unused, url);
    super.pushState(data, unused, url);
  }

  replaceState(
    data: any,
    unused: string,
    url?: string | URL | null | undefined,
  ): void {
    this.replaceStateSpy(data, unused, url);
    super.replaceState(data, unused, url);
  }

  resetMocks() {
    this.pushStateSpy.mockReset();
    this.replaceStateSpy.mockReset();
  }
}

describe('route', () => {
  const history = new MobxHistoryMock();
  const location = new MobxLocation(history);

  Route.setGlobalConfiguration({
    history,
    location,
  });

  beforeEach(() => {
    history.resetMocks();
  });

  it('/test', () => {
    const route = new Route('/test');
    route.navigate();
    expect(history.pushStateSpy).toBeCalledWith(null, '', '/test');
  });

  it('/test/:id/:bar', () => {
    const route = new Route('/test/:id/:bar');
    route.navigate({
      id: 1,
      bar: 'barg',
    });
    expect(history.pushStateSpy).toBeCalledWith(null, '', '/test/1/barg');
  });

  it('/test/*splat', () => {
    const route = new Route('/test/*splat');
    route.navigate({
      splat: [1, 2, 3],
    });
    expect(history.pushStateSpy).toBeCalledWith(null, '', '/test/1/2/3');
  });

  it('/users{/:id}/delete', () => {
    const route = new Route('/users{/:id}/delete');
    route.navigate({
      id: 1,
    });
    expect(history.pushStateSpy).toBeCalledWith(null, '', '/users/1/delete');

    history.resetMocks();

    route.navigate();
    expect(history.pushStateSpy).toBeCalledWith(null, '', '/users/delete');

    history.resetMocks();

    const childRoute = route.extend('/push/:id1{/:bar}');
    childRoute.navigate({
      id1: 1,
      bar: 2,
      id: 3,
    });
    expect(history.pushStateSpy).toBeCalledWith(
      null,
      '',
      '/users/3/delete/push/1/2',
    );
  });

  it('/posts{/:slug}/*rest', () => {
    const route = new Route('/posts{/:slug}/*rest');
    route.navigate({
      slug: true,
      rest: [1, 2, 3, 'bar'],
    });
    expect(history.pushStateSpy).toBeCalledWith(
      null,
      '',
      '/posts/true/1/2/3/bar',
    );
    const otherRoute = new Route('/kek/pek');

    expect(otherRoute.isMatches).toBe(false);
    expect(route.isMatches).toBe(true);
    expect(route.matchData).toEqual({
      path: '/posts/true/1/2/3/bar',
      params: {
        rest: ['1', '2', '3', 'bar'],
        slug: 'true',
      },
    });
  });
});

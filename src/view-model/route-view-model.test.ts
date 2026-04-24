import { when } from 'mobx';
import {
  createBrowserHistory,
  createMemoryHistory,
  type History,
} from 'mobx-location-history';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createRoute, Route, routeConfig } from '../core/index.js';
import { RouteViewModel } from './route-view-model.js';

const mockHistory = <THistory extends History>(history: THistory) => {
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

describe('RouteViewModel', () => {
  const history = mockHistory(createBrowserHistory());

  beforeEach(() => {
    routeConfig.update({
      history,
    });
    history.replace('/', null);
    globalThis.history.replaceState(null, '', '/');
    window.history.replaceState(null, '', '/');
    history.resetMock();
  });

  it('does not auto-unmount when route closes', async () => {
    const route = new Route('/test');
    await route.open();

    let didUnmounts = 0;

    class TestRouteViewModel extends RouteViewModel<typeof route> {
      route = route;

      override didUnmount() {
        didUnmounts += 1;
      }
    }

    const vm = new TestRouteViewModel({} as any);
    (vm as any).mount();

    await when(() => vm.isMounted);

    history.push('/other', null);
    await when(() => !route.isOpened);

    expect(didUnmounts).toBe(0);
    route.destroy();
  });

  it('keeps last payload params after route closes', async () => {
    const history = createMemoryHistory();
    const route1 = createRoute('/test/:id', { history: history });
    const route2 = createRoute('/other/:slug', { history: history });

    class Route1VM extends RouteViewModel<typeof route1> {
      route = route1;
    }
    class Route2VM extends RouteViewModel<typeof route2> {
      route = route2;
    }
    const vm = new Route1VM({} as any);
    const vm2 = new Route2VM({} as any);

    expect(vm.payload).toEqual({});
    expect(vm.pathParams).toEqual({});
    expect(vm2.payload).toEqual({});
    expect(vm2.pathParams).toEqual({});

    await route1.open('/test/123');

    expect(vm.payload).toEqual({ id: '123' });
    expect(vm.pathParams).toEqual({ id: '123' });
    expect(vm2.payload).toEqual({});
    expect(vm2.pathParams).toEqual({});

    await route2.open('/other/next');

    expect(vm.payload).toEqual({ id: '123' });
    expect(vm.pathParams).toEqual({ id: '123' });
    expect(vm2.payload).toEqual({ slug: 'next' });
    expect(vm2.pathParams).toEqual({ slug: 'next' });
  });
});

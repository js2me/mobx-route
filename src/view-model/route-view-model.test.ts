import { when } from 'mobx';
import { createBrowserHistory } from 'mobx-location-history';
import { describe, expect, it } from 'vitest';

import { Route, routeConfig } from '../core/index.js';
import { mockHistory } from '../core/route/route.test.js';
import { RouteViewModel } from './route-view-model.js';

describe('RouteViewModel', () => {
  it('does not auto-unmount when route closes', async () => {
    const history = mockHistory(createBrowserHistory());

    routeConfig.update({
      history,
    });

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
  });
});

/* eslint-disable sonarjs/no-unstable-nested-components */
import { act, render } from '@testing-library/react';
import { createBrowserHistory } from 'mobx-location-history';
import { beforeEach, describe, expect, it } from 'vitest';

import { Route, routeConfig } from '../../core/index.js';
import { mockHistory } from '../../core/route/route.test.js';

import { RouteViewGroup } from './route-view-group.js';
import { RouteView } from './route-view.js';

describe('<RouteViewGroup />', () => {
  it('Should render nothing when no one route is opened', async () => {
    const history = mockHistory(createBrowserHistory());

    routeConfig.update({
      history,
    });

    beforeEach(() => {
      history.clearMocks();
    });

    const route1 = new Route('/test1');
    const route2 = new Route('/test2');
    const route3 = new Route('/test3');

    const App = () => {
      return (
        <RouteViewGroup>
          <RouteView route={route1} view={() => <div>route1</div>} />
          <RouteView route={route2} view={() => <div>route2</div>} />
          <RouteView route={route3} view={() => <div>route3</div>} />
        </RouteViewGroup>
      );
    };

    const { container } = await act(async () => render(<App />));

    expect(container.firstChild).toBeNull();
  });

  it('Should render last non active element when no one route is opened', async () => {
    const history = mockHistory(createBrowserHistory());

    routeConfig.update({
      history,
    });

    beforeEach(() => {
      history.clearMocks();
    });

    const route1 = new Route('/test1');
    const route2 = new Route('/test2');
    const route3 = new Route('/test3');

    const App1 = () => {
      return (
        <RouteViewGroup>
          <RouteView route={route1} view={() => <div>route1</div>} />
          <RouteView route={route2} view={() => <div>route2</div>} />
          <RouteView route={route3} view={() => <div>route3</div>} />
          <div>not_found1</div>
        </RouteViewGroup>
      );
    };

    const screen1 = await act(async () => render(<App1 />));

    expect(screen1.getByText('not_found1')).toBeDefined();
  });

  it('Should render active element when 1-order route is opened', async () => {
    const history = mockHistory(createBrowserHistory());

    routeConfig.update({
      history,
    });

    beforeEach(() => {
      history.clearMocks();
    });

    const route1 = new Route('/test1');
    const route2 = new Route('/test2');
    const route3 = new Route('/test3');

    const App1 = () => {
      return (
        <RouteViewGroup>
          <RouteView route={route1} view={() => <div>route1</div>} />
          <RouteView route={route2} view={() => <div>route2</div>} />
          <RouteView route={route3} view={() => <div>route3</div>} />
          <div>not_found1</div>
        </RouteViewGroup>
      );
    };

    await route1.open();

    const screen1 = await act(async () => render(<App1 />));

    expect(screen1.getByText('route1')).toBeDefined();
  });

  it('Should render active element when 2-order route is opened', async () => {
    const history = mockHistory(createBrowserHistory());

    routeConfig.update({
      history,
    });

    beforeEach(() => {
      history.clearMocks();
    });

    const route1 = new Route('/test1');
    const route2 = new Route('/test2');
    const route3 = new Route('/test3');

    const App1 = () => {
      return (
        <RouteViewGroup>
          <RouteView route={route1} view={() => <div>route1</div>} />
          <RouteView route={route2} view={() => <div>route2</div>} />
          <RouteView route={route3} view={() => <div>route3</div>} />
          <div>not_found1</div>
        </RouteViewGroup>
      );
    };

    await route2.open();

    const screen1 = await act(async () => render(<App1 />));

    expect(screen1.getByText('route2')).toBeDefined();
  });

  it('Should render active element when 3-order route is opened', async () => {
    const history = mockHistory(createBrowserHistory());

    routeConfig.update({
      history,
    });

    beforeEach(() => {
      history.clearMocks();
    });

    const route1 = new Route('/test1');
    const route2 = new Route('/test2');
    const route3 = new Route('/test3');

    const App1 = () => {
      return (
        <RouteViewGroup>
          <RouteView route={route1} view={() => <div>route1</div>} />
          <RouteView route={route2} view={() => <div>route2</div>} />
          <RouteView route={route3} view={() => <div>route3</div>} />
          <div>not_found1</div>
        </RouteViewGroup>
      );
    };

    await route3.open();

    const screen1 = await act(async () => render(<App1 />));

    expect(screen1.getByText('route3')).toBeDefined();
  });

  it('Should render element of LAST OPENED route', async () => {
    const history = mockHistory(createBrowserHistory());

    routeConfig.update({
      history,
    });

    beforeEach(() => {
      history.clearMocks();
    });

    const route1 = new Route('/test');
    const route2 = new Route('/test');
    const route3 = new Route('/test');

    const App1 = () => {
      return (
        <RouteViewGroup>
          <RouteView route={route1} view={() => <div>route1</div>} />
          <RouteView route={route2} view={() => <div>route2</div>} />
          <RouteView route={route3} view={() => <div>route3</div>} />
          <div>not_found1</div>
        </RouteViewGroup>
      );
    };

    await route3.open();

    const screen1 = await act(async () => render(<App1 />));

    expect(screen1.getByText('route1')).toBeDefined();
    expect(() => screen1.getByText('route2')).toThrowError();
    expect(() => screen1.getByText('route3')).toThrowError();
    expect(() => screen1.getByText('not_found1')).toThrowError();
  });
});

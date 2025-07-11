/* eslint-disable sonarjs/no-unstable-nested-components */
import { act, render } from '@testing-library/react';
import { createBrowserHistory } from 'mobx-location-history';
import { ReactNode } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

import { Route, routeConfig } from '../../core/index.js';
import { mockHistory } from '../../core/route/route.test.js';

import { RouteView } from './route-view.js';
import { Switch } from './switch.js';

describe('<Switch/>', () => {
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
        <Switch>
          <RouteView route={route1} view={() => <div>route1</div>} />
          <RouteView route={route2} view={() => <div>route2</div>} />
          <RouteView route={route3} view={() => <div>route3</div>} />
        </Switch>
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
        <Switch>
          <RouteView route={route1} view={() => <div>route1</div>} />
          <RouteView route={route2} view={() => <div>route2</div>} />
          <RouteView route={route3} view={() => <div>route3</div>} />
          <div>not_found1</div>
        </Switch>
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
        <Switch>
          <RouteView route={route1} view={() => <div>route1</div>} />
          <RouteView route={route2} view={() => <div>route2</div>} />
          <RouteView route={route3} view={() => <div>route3</div>} />
          <div>not_found1</div>
        </Switch>
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
        <Switch>
          <RouteView route={route1} view={() => <div>route1</div>} />
          <RouteView route={route2} view={() => <div>route2</div>} />
          <RouteView route={route3} view={() => <div>route3</div>} />
          <div>not_found1</div>
        </Switch>
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
        <Switch>
          <RouteView route={route1} view={() => <div>route1</div>} />
          <RouteView route={route2} view={() => <div>route2</div>} />
          <RouteView route={route3} view={() => <div>route3</div>} />
          <div>not_found1</div>
        </Switch>
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
        <Switch>
          <RouteView route={route1} view={() => <div>route1</div>} />
          <RouteView route={route2} view={() => <div>route2</div>} />
          <RouteView route={route3} view={() => <div>route3</div>} />
          <div>not_found1</div>
        </Switch>
      );
    };

    await route3.open();

    const screen1 = await act(async () => render(<App1 />));

    expect(screen1.getByText('route3')).toBeDefined();
    expect(() => screen1.getByText('route2')).toThrowError();
    expect(() => screen1.getByText('route1')).toThrowError();
    expect(() => screen1.getByText('not_found1')).toThrowError();
  });

  it('Should render element with wrapper component if it is opened', async () => {
    const history = mockHistory(createBrowserHistory());

    routeConfig.update({
      history,
    });

    beforeEach(() => {
      history.clearMocks();
    });

    const route1 = new Route('/route-1-test');
    const route2 = new Route('/route-2-test');
    const route3 = new Route('/route-3-test');

    const Wrapper = ({
      children,
      text,
    }: {
      text: string;
      children: ReactNode;
    }) => {
      return (
        <div className="wrapper">
          <label>{text}</label>
          {children}
        </div>
      );
    };

    const App1 = () => {
      return (
        <Switch>
          <Wrapper text="wrapper1">
            <RouteView route={route1} view={() => <div>route1</div>} />
          </Wrapper>
          <Wrapper text="wrapper2">
            <RouteView route={route2} view={() => <div>route2</div>} />
          </Wrapper>
          <Wrapper text="wrapper3">
            <RouteView route={route3} view={() => <div>route3</div>} />
          </Wrapper>
          <div>not_found1</div>
        </Switch>
      );
    };

    await route2.open();

    const screen1 = await act(async () => render(<App1 />));

    expect(screen1.getByText('route2')).toBeDefined();
    expect(screen1.getByText('wrapper2')).toBeDefined();
    expect(() => screen1.getByText('route1')).toThrowError();
    expect(() => screen1.getByText('wrapper1')).toThrowError();
    expect(() => screen1.getByText('route3')).toThrowError();
    expect(() => screen1.getByText('wrapper3')).toThrowError();
    expect(() => screen1.getByText('not_found1')).toThrowError();
  });
});

import { render, screen } from '@solidjs/testing-library';
import { enableObservableTracking } from 'mobx-solid';
import { createBrowserHistory, type History } from 'mobx-location-history';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Enable MobX ↔ SolidJS reactivity bridge
enableObservableTracking();
import { sleep } from 'yummies/async';
import { createRoute, routeConfig } from '../../../../src/core/index.js';
import { RouteView } from './route-view.js';

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

describe('<RouteView />', () => {
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

  it('should render static children when route is not provided', () => {
    render(() => <RouteView>always visible</RouteView>);

    expect(screen.getByText('always visible')).toBeDefined();
  });

  it('should call children render function when route is not provided', () => {
    const children = vi.fn(() => <div>render fn</div>);

    render(() => <RouteView>{children}</RouteView>);

    expect(children).toHaveBeenCalledTimes(1);
    expect(screen.getByText('render fn')).toBeDefined();
  });

  it('should render fallback when route is closed', () => {
    const route = createRoute('/closed/:id');

    render(() => (
      <RouteView
        route={route}
        fallback={<div>not opened</div>}
        view={() => <div />}
      />
    ));

    expect(screen.getByText('not opened')).toBeDefined();
  });

  it('should render null when route is closed and no fallback provided', () => {
    const route = createRoute('/closed-null/:id');
    const { container } = render(() => (
      <RouteView route={route} view={() => <div>view</div>} />
    ));

    expect(container.firstChild).toBeNull();
  });

  it('should render provided view and pass route params and children', async () => {
    const route = createRoute('/view/:id');
    const View = (props: any) => (
      <div>{`view:${props.params.id}:${props.children}`}</div>
    );
    await route.open({ id: '42' });

    render(() => (
      <RouteView route={route} view={View}>
        child
      </RouteView>
    ));

    expect(screen.getByText('view:42:child')).toBeDefined();
  });

  it('should call children render function with params and route for opened route', async () => {
    const route = createRoute('/render-fn/:id');
    const children = vi.fn((params: any, currentRoute: any) => (
      <div>{`${params.id}:${currentRoute === route}`}</div>
    ));
    await route.open({ id: '5' });

    render(() => <RouteView route={route}>{children}</RouteView>);

    expect(children).toHaveBeenCalledWith(route.params, route);
    expect(screen.getByText('5:true')).toBeDefined();
  });

  it('should render view while route isOpening (async beforeOpen)', async () => {
    vi.useFakeTimers();

    const route = createRoute('/opening-view/:id', {
      beforeOpen: async () => {
        await sleep(50);
      },
    });

    history.push('/opening-view/7');
    expect(route.isOpening).toBe(true);
    expect(route.isOpened).toBe(false);

    render(() => (
      <RouteView
        route={route}
        fallback={<div>fallback</div>}
        view={(props: any) => <div>{`opening:${props.params.id}`}</div>}
      />
    ));

    expect(screen.getByText('opening:7')).toBeDefined();
    expect(screen.queryByText('fallback')).toBeNull();

    await vi.runAllTimersAsync();
    expect(route.isOpened).toBe(true);
    expect(screen.getByText('opening:7')).toBeDefined();

    vi.useRealTimers();
  });
});

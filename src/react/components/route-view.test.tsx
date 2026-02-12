import { render, screen } from '@testing-library/react';
import { createBrowserHistory, type History } from 'mobx-location-history';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRoute, routeConfig } from '../../core/index.js';

const { loadableMock } = vi.hoisted(() => ({
  loadableMock: vi.fn(),
}));

vi.mock('react-simple-loadable', () => ({
  loadable: loadableMock,
}));

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

    loadableMock.mockReset();
    loadableMock.mockImplementation(() => {
      return ({ params, children }: any) => (
        <div>{`lazy:${params.id}:${children ?? ''}`}</div>
      );
    });
  });

  it('should render static children when route is not provided', () => {
    render(<RouteView>always visible</RouteView>);

    expect(screen.getByText('always visible')).toBeDefined();
  });

  it('should call children render function when route is not provided', () => {
    const children = vi.fn(() => <div>render fn</div>);

    render(<RouteView>{children}</RouteView>);

    expect(children).toHaveBeenCalledTimes(1);
    expect(screen.getByText('render fn')).toBeDefined();
  });

  it('should render fallback when route is closed', () => {
    const route = createRoute('/closed/:id');

    render(
      <RouteView
        route={route}
        fallback={<div>not opened</div>}
        view={() => <div />}
      />,
    );

    expect(screen.getByText('not opened')).toBeDefined();
  });

  it('should render null when route is closed and no fallback provided', () => {
    const route = createRoute('/closed-null/:id');
    const { container } = render(
      <RouteView route={route} view={() => <div>view</div>} />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render provided view and pass route params and children', async () => {
    const route = createRoute('/view/:id');
    const View = ({ params, children }: any) => (
      <div>{`view:${params.id}:${children}`}</div>
    );
    await route.open({ id: '42' });

    render(
      <RouteView route={route} view={View}>
        child
      </RouteView>,
    );

    expect(screen.getByText('view:42:child')).toBeDefined();
  });

  it('should call children render function with params and route for opened route', async () => {
    const route = createRoute('/render-fn/:id');
    const children = vi.fn((params: any, currentRoute: any) => (
      <div>{`${params.id}:${currentRoute === route}`}</div>
    ));
    await route.open({ id: '5' });

    render(<RouteView route={route}>{children}</RouteView>);

    expect(children).toHaveBeenCalledWith(route.params, route);
    expect(screen.getByText('5:true')).toBeDefined();
  });

  it('should create loadable component once and pass loadable config', async () => {
    const route = createRoute('/lazy/:id');
    const loading = () => <div>loading</div>;
    const preload = true;
    const throwOnError = true;
    const loadView = vi.fn(async () => {
      return ({ params }: any) => <div>{params.id}</div>;
    });
    await route.open({ id: '1' });

    const { rerender } = render(
      <RouteView
        route={route}
        loadView={loadView}
        loading={loading}
        preload={preload}
        throwOnError={throwOnError}
      >
        child
      </RouteView>,
    );

    expect(loadableMock).toHaveBeenCalledTimes(1);

    const loadableConfig = loadableMock.mock.calls[0][0];
    expect(loadableConfig.loading).toBe(loading);
    expect(loadableConfig.preload).toBe(preload);
    expect(loadableConfig.throwOnError).toBe(throwOnError);
    expect(loadableConfig.cache).toBe(false);

    await loadableConfig.load();
    expect(loadView).toHaveBeenCalledWith(route);
    expect(screen.getByText('lazy:1:child')).toBeDefined();

    rerender(
      <RouteView route={route} loadView={loadView}>
        child
      </RouteView>,
    );
    expect(loadableMock).toHaveBeenCalledTimes(1);
  });
});

import { render, screen } from '@solidjs/testing-library';
import { when } from 'mobx';
import { enableObservableTracking } from 'mobx-solid';
import { createBrowserHistory } from 'mobx-location-history';
import { describe, expect, it, vi } from 'vitest';

// Enable MobX ↔ SolidJS reactivity bridge
enableObservableTracking();
import { Route, routeConfig } from '../../../../src/core/index.js';
import { createVirtualRoute } from '../../../../src/core/virtual-route/virtual-route.js';
import { RouteView } from './route-view.js';
import { RouteViewGroup } from './route-view-group.js';

const mockHistory = (history: ReturnType<typeof createBrowserHistory>) => {
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

  return history as typeof history & {
    resetMock: () => void;
  };
};

describe('<RouteViewGroup />', () => {
  it('Should render nothing when no one route is opened', async () => {
    const history = mockHistory(createBrowserHistory());

    routeConfig.update({
      history,
    });

    const route1 = new Route('/test1');
    const route2 = new Route('/test2');
    const route3 = new Route('/test3');

    const { container } = render(() => (
      <RouteViewGroup>
        <RouteView route={route1} view={() => <div>route1</div>} />
        <RouteView route={route2} view={() => <div>route2</div>} />
        <RouteView route={route3} view={() => <div>route3</div>} />
      </RouteViewGroup>
    ));

    expect(container.firstChild).toBeNull();
  });

  it('Should render active element when 1-order route is opened', async () => {
    const history = mockHistory(createBrowserHistory());

    routeConfig.update({
      history,
    });

    const route1 = new Route('/test1');
    const route2 = new Route('/test2');
    const route3 = new Route('/test3');

    await route1.open();

    render(() => (
      <RouteViewGroup>
        <RouteView route={route1} view={() => <div>route1</div>} />
        <RouteView route={route2} view={() => <div>route2</div>} />
        <RouteView route={route3} view={() => <div>route3</div>} />
        <div>not_found1</div>
      </RouteViewGroup>
    ));

    expect(screen.getByText('route1')).toBeDefined();
  });

  it('Should render active element when 2-order route is opened', async () => {
    const history = mockHistory(createBrowserHistory());

    routeConfig.update({
      history,
    });

    const route1 = new Route('/test1');
    const route2 = new Route('/test2');
    const route3 = new Route('/test3');

    await route2.open();

    render(() => (
      <RouteViewGroup>
        <RouteView route={route1} view={() => <div>route1</div>} />
        <RouteView route={route2} view={() => <div>route2</div>} />
        <RouteView route={route3} view={() => <div>route3</div>} />
        <div>not_found1</div>
      </RouteViewGroup>
    ));

    expect(screen.getByText('route2')).toBeDefined();
  });

  it('Should render element of FIRST OPENED route', async () => {
    const history = mockHistory(createBrowserHistory());

    routeConfig.update({
      history,
    });

    const route1 = new Route('/test');
    const route2 = new Route('/test');
    const route3 = new Route('/test');

    await route3.open();

    render(() => (
      <RouteViewGroup>
        <RouteView route={route1} view={() => <div>route1</div>} />
        <RouteView route={route2} view={() => <div>route2</div>} />
        <RouteView route={route3} view={() => <div>route3</div>} />
        <RouteView><div>not_found1</div></RouteView>
      </RouteViewGroup>
    ));

    expect(screen.getByText('route1')).toBeDefined();
    expect(() => screen.getByText('route2')).toThrowError();
    expect(() => screen.getByText('route3')).toThrowError();
    expect(() => screen.getByText('not_found1')).toThrowError();
  });

  it('Should render element of LAST OPENED route (useLastOpened)', async () => {
    const history = mockHistory(createBrowserHistory());

    routeConfig.update({
      history,
    });

    const route1 = new Route('/test');
    const route2 = new Route('/test');
    const route3 = new Route('/test');

    await route3.open();

    render(() => (
      <RouteViewGroup useLastOpened>
        <RouteView route={route1} view={() => <div>route1</div>} />
        <RouteView route={route2} view={() => <div>route2</div>} />
        <RouteView route={route3} view={() => <div>route3</div>} />
        <RouteView><div>not_found1</div></RouteView>
      </RouteViewGroup>
    ));

    expect(() => screen.getByText('route1')).toThrowError();
    expect(() => screen.getByText('route2')).toThrowError();
    expect(screen.getByText('route3')).toBeDefined();
    expect(() => screen.getByText('not_found1')).toThrowError();
  });

  it('Should navigate to string otherwise URL with query/state', async () => {
    const history = mockHistory(createBrowserHistory());

    routeConfig.update({
      history,
    });

    const route1 = new Route('/test1');

    render(() => (
      <RouteViewGroup
        otherwise="/not-found"
        query={{ from: 'route-group' }}
        state={{ code: 404 }}
      >
        <RouteView route={route1} view={() => <div>route1</div>} />
      </RouteViewGroup>
    ));

    expect(history.push).toHaveBeenCalledWith(
      '/not-found?from=route-group',
      expect.objectContaining({ code: 404 }),
    );
  });

  it('Should use history.replace for string otherwise when replace=true', async () => {
    const history = mockHistory(createBrowserHistory());

    routeConfig.update({
      history,
    });

    const route1 = new Route('/test1');

    render(() => (
      <RouteViewGroup otherwise="/not-found" replace>
        <RouteView route={route1} view={() => <div>route1</div>} />
      </RouteViewGroup>
    ));

    expect(history.replace).toHaveBeenCalledWith('/not-found', undefined);
    expect(history.push).not.toHaveBeenCalled();
  });

  it('Should open route passed to otherwise with params and navigation options', async () => {
    const history = mockHistory(createBrowserHistory());

    routeConfig.update({
      history,
    });

    const route1 = new Route('/test1');
    const otherwiseRoute = new Route('/fallback/:id');
    const otherwiseSpy = vi.spyOn(otherwiseRoute, 'open');

    render(() => (
      <RouteViewGroup
        otherwise={otherwiseRoute}
        params={{ id: '42' }}
        query={{ source: 'group' }}
        replace
        state={{ test: true }}
      >
        <RouteView route={route1} view={() => <div>route1</div>} />
      </RouteViewGroup>
    ));

    expect(otherwiseSpy).toHaveBeenCalledWith(
      { id: '42' },
      expect.objectContaining({
        query: { source: 'group' },
        replace: true,
        state: { test: true },
      }),
    );
  });

  it('Should wrap rendered node with layout', async () => {
    const history = mockHistory(createBrowserHistory());

    routeConfig.update({
      history,
    });

    const route1 = new Route('/test1');

    const Layout = (props: { children?: any }) => (
      <section data-testid="layout">{props.children}</section>
    );

    render(() => (
      <RouteViewGroup layout={Layout}>
        <RouteView route={route1} view={() => <div>route1</div>} />
        <div>fallback-content</div>
      </RouteViewGroup>
    ));

    expect(screen.getByTestId('layout')).toBeDefined();
    expect(screen.getByText('fallback-content')).toBeDefined();
  });

  it('does not open otherwise while a route isOpening', async () => {
    const history = mockHistory(createBrowserHistory());
    routeConfig.update({ history });

    let resolveOpen!: () => void;
    const page = new Route('/page', {
      beforeOpen: () =>
        new Promise<void>((resolve) => {
          resolveOpen = resolve;
        }),
    });
    const otherwiseRoute = new Route('/fallback');
    const otherwiseSpy = vi.spyOn(otherwiseRoute, 'open');

    history.push('/page');
    await when(() => page.isOpening);

    render(() => (
      <RouteViewGroup otherwise={otherwiseRoute}>
        <RouteView route={page} view={() => <div>page</div>} />
      </RouteViewGroup>
    ));

    expect(otherwiseSpy).not.toHaveBeenCalled();
    expect(page.isOpening).toBe(true);

    resolveOpen();
    await when(() => page.isOpened);

    expect(page.isOpened).toBe(true);
    expect(otherwiseSpy).not.toHaveBeenCalled();
  });

  it('keeps opening path route over already opened otherwise (notFound)', async () => {
    const history = mockHistory(createBrowserHistory());
    routeConfig.update({ history });

    let resolveOpen!: () => void;
    const home = new Route('/', {
      exact: true,
      beforeOpen: () =>
        new Promise<void>((resolve) => {
          resolveOpen = resolve;
        }),
    });
    const notFound = createVirtualRoute();

    history.push('/');
    await when(() => home.isOpening);

    await notFound.open();
    expect(notFound.isOpened).toBe(true);

    render(() => (
      <RouteViewGroup otherwise={notFound}>
        <RouteView route={home} view={() => <div>home</div>} />
        <RouteView route={notFound} view={() => <div>not_found</div>} />
      </RouteViewGroup>
    ));

    // home is opening (not yet confirmed), so it should render home
    expect(screen.getByText('home')).toBeDefined();
    expect(() => screen.getByText('not_found')).toThrowError();

    resolveOpen();
    await when(() => home.isOpened);

    expect(screen.getByText('home')).toBeDefined();
    expect(() => screen.getByText('not_found')).toThrowError();
  });
});

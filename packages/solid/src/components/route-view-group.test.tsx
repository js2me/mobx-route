import { render, screen } from '@solidjs/testing-library';
import { when } from 'mobx';
import { createBrowserHistory } from 'mobx-location-history';
import { RouteView, RouteViewGroup } from 'mobx-route/solid';
import { createSignal, Show } from 'solid-js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Route, routeConfig } from '../../../../src/core/index.js';
import { createVirtualRoute } from '../../../../src/core/virtual-route/virtual-route.js';

const mockHistory = (history: ReturnType<typeof createBrowserHistory>) => {
  vi.spyOn(history, 'push');
  vi.spyOn(history, 'replace');
  return history;
};

describe('<RouteViewGroup />', () => {
  afterEach(() => vi.restoreAllMocks());

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
        <RouteView>
          <div>not_found1</div>
        </RouteView>
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
        <RouteView>
          <div>not_found1</div>
        </RouteView>
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

  it('redirects an empty group without rendering the layout', () => {
    const history = mockHistory(createBrowserHistory());
    routeConfig.update({ history });

    const layout = vi.fn(() => <section>Layout</section>);
    const { container } = render(() => (
      <RouteViewGroup otherwise="/not-found" layout={layout}>
        <RouteView>Fallback</RouteView>
      </RouteViewGroup>
    ));

    expect(history.push).toHaveBeenCalledExactlyOnceWith(
      '/not-found',
      undefined,
    );
    expect(layout).not.toHaveBeenCalled();
    expect(container.firstChild).toBeNull();
  });

  it('picks another view when the selected route changes or unmounts', async () => {
    const history = mockHistory(createBrowserHistory());
    routeConfig.update({ history });
    const first = new Route('/group-active');
    const second = new Route('/group-active');
    const inactive = new Route('/group-inactive');
    await first.open();

    const [route, setRoute] = createSignal<typeof first | typeof inactive>(
      first,
    );
    const [mounted, setMounted] = createSignal(true);
    render(() => (
      <RouteViewGroup>
        <Show when={mounted()}>
          <RouteView route={route()} fallback="First fallback">
            First
          </RouteView>
        </Show>
        <RouteView route={second} fallback="Second fallback">
          Second
        </RouteView>
      </RouteViewGroup>
    ));

    expect(screen.getByText('First')).toBeDefined();
    expect(screen.queryByText('Second fallback')).toBeNull();
    setRoute(inactive);
    expect(screen.getByText('Second')).toBeDefined();
    expect(screen.queryByText('First fallback')).toBeNull();
    setRoute(first);
    expect(screen.getByText('First')).toBeDefined();
    setMounted(false);
    expect(screen.getByText('Second')).toBeDefined();
    expect(screen.queryByText('First')).toBeNull();
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

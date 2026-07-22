import { act, render } from '@testing-library/react';
import { when } from 'mobx';
import { createBrowserHistory } from 'mobx-location-history';
import { withViewModel } from 'mobx-view-model';
import { describe, expect, it, vi } from 'vitest';
import { sleep } from 'yummies/async';
import { Route, routeConfig } from '../../core/index.js';
import { mockHistory } from '../../core/route/route.test.js';
import { createVirtualRoute } from '../../core/virtual-route/virtual-route.js';
import { RouteViewModel } from '../../view-model/route-view-model.js';
import { RouteView } from './route-view.js';
import { RouteViewGroup } from './route-view-group.js';

describe('<RouteViewGroup />', () => {
  it('Should mount/unmount VM views on route changes', async () => {
    const history = mockHistory(createBrowserHistory());

    routeConfig.update({
      history,
    });

    const routeA = new Route('/route-a');
    const routeB = new Route('/route-b');

    const countersA = {
      didMounts: 0,
      didUnmounts: 0,
    };
    const countersB = {
      didMounts: 0,
      didUnmounts: 0,
    };

    class VmA extends RouteViewModel<typeof routeA> {
      route = routeA;
      override didMount() {
        countersA.didMounts += 1;
      }

      override didUnmount() {
        countersA.didUnmounts += 1;
      }
    }

    class VmB extends RouteViewModel<typeof routeB> {
      route = routeB;
      override didMount() {
        countersB.didMounts += 1;
      }

      override didUnmount() {
        countersB.didUnmounts += 1;
      }
    }

    const ViewA = withViewModel(VmA, () => <div />);
    const ViewB = withViewModel(VmB, () => <div />);

    const App = () => {
      return (
        <RouteViewGroup>
          <RouteView key="route-a" route={routeA} view={ViewA} />
          <RouteView key="route-b" route={routeB} view={ViewB} />
        </RouteViewGroup>
      );
    };

    history.push('/route-a', null);
    await when(() => routeA.isOpened);

    let screen: ReturnType<typeof render>;
    await act(async () => {
      screen = render(<App />);
    });

    expect(countersA).toEqual({
      didMounts: 1,
      didUnmounts: 0,
    });
    expect(countersB).toEqual({
      didMounts: 0,
      didUnmounts: 0,
    });

    await act(async () => {
      history.push('/route-b', null);
    });
    await when(() => routeB.isOpened);
    await when(() => !routeA.isOpened);
    await act(async () => {
      screen.rerender(<App />);
    });

    expect(countersA).toEqual({
      didMounts: 1,
      didUnmounts: 1,
    });
    expect(countersB).toEqual({
      didMounts: 1,
      didUnmounts: 0,
    });

    await act(async () => {
      history.push('/route-a', null);
    });
    await when(() => routeA.isOpened);
    await when(() => !routeB.isOpened);
    await act(async () => {
      screen.rerender(<App />);
    });

    expect(countersA).toEqual({
      didMounts: 2,
      didUnmounts: 1,
    });
    expect(countersB).toEqual({
      didMounts: 1,
      didUnmounts: 1,
    });
  });
  it('Should render nothing when no one route is opened', async () => {
    const history = mockHistory(createBrowserHistory());

    routeConfig.update({
      history,
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

  it('Should render element of FIRST OPENED route', async () => {
    const history = mockHistory(createBrowserHistory());

    routeConfig.update({
      history,
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

  it('Should render element of LAST OPENED route (useLastOpened)', async () => {
    const history = mockHistory(createBrowserHistory());

    routeConfig.update({
      history,
    });

    const route1 = new Route('/test');
    const route2 = new Route('/test');
    const route3 = new Route('/test');

    const App1 = () => {
      return (
        <RouteViewGroup useLastOpened>
          <RouteView route={route1} view={() => <div>route1</div>} />
          <RouteView route={route2} view={() => <div>route2</div>} />
          <RouteView route={route3} view={() => <div>route3</div>} />
          <div>not_found1</div>
        </RouteViewGroup>
      );
    };

    await route3.open();

    const screen1 = await act(async () => render(<App1 />));

    expect(() => screen1.getByText('route1')).toThrowError();
    expect(() => screen1.getByText('route2')).toThrowError();
    expect(screen1.getByText('route3')).toBeDefined();
    expect(() => screen1.getByText('not_found1')).toThrowError();
  });

  it('Should navigate to string otherwise URL with query/state', async () => {
    const history = mockHistory(createBrowserHistory());

    routeConfig.update({
      history,
    });

    const route1 = new Route('/test1');

    await act(async () => {
      render(
        <RouteViewGroup
          otherwise="/not-found"
          query={{ from: 'route-group' }}
          state={{ code: 404 }}
        >
          <RouteView route={route1} view={() => <div>route1</div>} />
        </RouteViewGroup>,
      );
    });

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

    await act(async () => {
      render(
        <RouteViewGroup otherwise="/not-found" replace>
          <RouteView route={route1} view={() => <div>route1</div>} />
        </RouteViewGroup>,
      );
    });

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

    await act(async () => {
      render(
        <RouteViewGroup
          otherwise={otherwiseRoute}
          params={{ id: '42' }}
          query={{ source: 'group' }}
          replace
          state={{ test: true }}
        >
          <RouteView route={route1} view={() => <div>route1</div>} />
        </RouteViewGroup>,
      );
    });

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

    const Layout = ({ children }: { children?: React.ReactNode }) => (
      <section data-testid="layout">{children}</section>
    );

    const screen = await act(async () =>
      render(
        <RouteViewGroup layout={Layout}>
          <RouteView route={route1} view={() => <div>route1</div>} />
          <div>fallback-content</div>
        </RouteViewGroup>,
      ),
    );

    expect(screen.getByTestId('layout')).toBeDefined();
    expect(screen.getByText('fallback-content')).toBeDefined();
  });

  it('keeps opening route selected instead of last inactive (Back / async open gap)', async () => {
    const history = mockHistory(createBrowserHistory());
    routeConfig.update({ history });

    let resolveProductOpen!: () => void;
    const product = new Route('/products/:id', {
      exact: true,
      beforeOpen: () =>
        new Promise<void>((resolve) => {
          resolveProductOpen = resolve;
        }),
    });
    const cart = new Route('/cart', { exact: true });

    history.push('/products/1');
    await when(() => product.isOpening);
    resolveProductOpen();
    await when(() => product.isOpened);

    history.push('/cart');
    await when(() => cart.isOpened);

    const App = () => (
      <RouteViewGroup>
        <RouteView
          route={product}
          view={({ params }: any) => <div>{`product:${params.id}`}</div>}
        />
        <RouteView route={cart} view={() => <div>cart</div>} />
        <div>not_found</div>
      </RouteViewGroup>
    );

    let screen!: ReturnType<typeof render>;
    await act(async () => {
      screen = render(<App />);
    });
    expect(screen.getByText('cart')).toBeDefined();

    await act(async () => {
      history.back();
    });
    await when(() => product.isOpening);
    await act(async () => {});

    expect(product.isOpened).toBe(false);
    expect(screen.getByText('product:1')).toBeDefined();
    expect(screen.queryByText('not_found')).toBeNull();
    expect(screen.queryByText('cart')).toBeNull();

    await act(async () => {
      resolveProductOpen();
    });
    await when(() => product.isOpened);
    await act(async () => {});

    expect(screen.getByText('product:1')).toBeDefined();
  });

  it('does not open otherwise while a route isOpening', async () => {
    vi.useFakeTimers();

    const history = mockHistory(createBrowserHistory());
    routeConfig.update({ history });

    const page = new Route('/page', {
      beforeOpen: async () => {
        await sleep(50);
      },
    });
    const otherwiseRoute = new Route('/fallback');
    const otherwiseSpy = vi.spyOn(otherwiseRoute, 'open');

    history.push('/page');
    expect(page.isOpening).toBe(true);

    await act(async () => {
      render(
        <RouteViewGroup otherwise={otherwiseRoute}>
          <RouteView route={page} view={() => <div>page</div>} />
        </RouteViewGroup>,
      );
    });

    expect(otherwiseSpy).not.toHaveBeenCalled();
    expect(page.isOpening).toBe(true);

    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(page.isOpened).toBe(true);
    expect(otherwiseSpy).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('keeps opening path route over already opened otherwise (notFound)', async () => {
    vi.useFakeTimers();

    const history = mockHistory(createBrowserHistory());
    routeConfig.update({ history });

    const home = new Route('/', {
      exact: true,
      beforeOpen: async () => {
        await sleep(50);
      },
    });
    const notFound = createVirtualRoute();

    history.push('/');
    expect(home.isOpening).toBe(true);

    await act(async () => {
      await notFound.open();
    });
    expect(notFound.isOpened).toBe(true);

    let screen!: ReturnType<typeof render>;
    await act(async () => {
      screen = render(
        <RouteViewGroup otherwise={notFound}>
          <RouteView route={home} view={() => <div>home</div>} />
          <RouteView route={notFound} view={() => <div>not_found</div>} />
        </RouteViewGroup>,
      );
    });

    expect(screen.getByText('home')).toBeDefined();
    expect(() => screen.getByText('not_found')).toThrowError();

    await act(async () => {
      await vi.runAllTimersAsync();
    });
    await when(() => home.isOpened);

    expect(screen.getByText('home')).toBeDefined();
    expect(() => screen.getByText('not_found')).toThrowError();

    vi.useRealTimers();
  });

  it('keeps opening path route over already opened notFound (without useLastOpened)', async () => {
    vi.useFakeTimers();

    const history = mockHistory(createBrowserHistory());
    routeConfig.update({ history });

    const home = new Route('/', {
      exact: true,
      beforeOpen: async () => {
        await sleep(50);
      },
    });
    const notFound = createVirtualRoute();

    history.push('/');
    expect(home.isOpening).toBe(true);

    await act(async () => {
      await notFound.open();
    });
    expect(notFound.isOpened).toBe(true);

    let screen!: ReturnType<typeof render>;
    await act(async () => {
      screen = render(
        <RouteViewGroup>
          <RouteView route={home} view={() => <div>home</div>} />
          <RouteView route={notFound} view={() => <div>not_found</div>} />
        </RouteViewGroup>,
      );
    });

    expect(screen.getByText('home')).toBeDefined();
    expect(() => screen.getByText('not_found')).toThrowError();

    await act(async () => {
      await vi.runAllTimersAsync();
    });
    await when(() => home.isOpened);

    expect(screen.getByText('home')).toBeDefined();
    expect(() => screen.getByText('not_found')).toThrowError();

    vi.useRealTimers();
  });

  it('keeps opening path route over already opened notFound (with useLastOpened)', async () => {
    vi.useFakeTimers();

    const history = mockHistory(createBrowserHistory());
    routeConfig.update({ history });

    const home = new Route('/', {
      exact: true,
      beforeOpen: async () => {
        await sleep(50);
      },
    });
    const notFound = createVirtualRoute();

    history.push('/');
    expect(home.isOpening).toBe(true);

    await act(async () => {
      await notFound.open();
    });
    expect(notFound.isOpened).toBe(true);

    let screen!: ReturnType<typeof render>;
    await act(async () => {
      screen = render(
        <RouteViewGroup useLastOpened>
          <RouteView route={home} view={() => <div>home</div>} />
          <RouteView route={notFound} view={() => <div>not_found</div>} />
        </RouteViewGroup>,
      );
    });

    expect(screen.getByText('not_found')).toBeDefined();
    expect(() => screen.getByText('home')).toThrowError();

    void notFound.open();
    await act(async () => {
      await vi.runAllTimersAsync();
    });
    await when(() => notFound.isOpened);

    expect(screen.getByText('not_found')).toBeDefined();
    expect(() => screen.getByText('home')).toThrowError();

    vi.useRealTimers();
  });
});

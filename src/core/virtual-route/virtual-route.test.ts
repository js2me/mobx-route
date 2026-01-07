import { when } from 'mobx';
import { createBrowserHistory } from 'mobx-location-history';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { routeConfig } from '../config/config.js';
import { mockHistory } from '../route/route.test.js';
import { createVirtualRoute, VirtualRoute } from './virtual-route.js';

describe('VirtualRoute', () => {
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

  it('should open and close route manually', async () => {
    const route = new VirtualRoute<{}>();

    const isOpeningCalledFn = vi.fn();

    when(() => route.isOpening, isOpeningCalledFn);

    expect(route.isOpening).toBe(false);
    expect(route.isOpened).toBe(false);

    await route.open();

    expect(route.isOpening).toBe(false);
    expect(route.isOpened).toBe(true);

    route.close();
    expect(route.isOpening).toBe(false);
    expect(route.isOpened).toBe(false);

    expect(isOpeningCalledFn).toBeCalledTimes(1);
  });

  it('should open route with params and close it', async () => {
    const route = new VirtualRoute<{ id: string }>();

    expect(route.isOpening).toBe(false);
    expect(route.isOpened).toBe(false);
    expect(route.params).toBeNull();

    await route.open({ id: '123' });

    expect(route.isOpened).toBe(true);
    expect(route.params).toEqual({ id: '123' });

    await route.close();

    expect(route.isOpening).toBe(false);
    expect(route.isOpened).toBe(false);
    expect(route.params).toBeNull();
  });

  it('should open route when query needed param will changed', async () => {
    const route = new VirtualRoute({
      checkOpened: (it) => it.query.data.id === '123',
    });

    expect(route.isOpening).toBe(false);
    expect(route.isOpened).toBe(false);
    expect(route.params).toBeNull();

    history.replace('/?id=123', null);

    await when(() => history.locationUrl === '/?id=123');

    expect(route.isOpened).toBe(true);
    expect(route.query.data).toEqual({ id: '123' });
  });

  it('route should complete full lyfecicle of open (without checkOpened)', async () => {
    const lifecycle: string[] = [];

    const beforeOpenFn = vi.fn(() => {
      lifecycle.push('beforeOpen');
    });
    const afterOpenFn = vi.fn(() => {
      lifecycle.push('afterOpen');
    });
    const beforeCloseFn = vi.fn(() => {
      lifecycle.push('beforeClose');
    });
    const afterCloseFn = vi.fn(() => {
      lifecycle.push('afterClose');
    });
    const openFn = vi.fn(() => {
      lifecycle.push('open');
    });

    const route = createVirtualRoute({
      beforeOpen: beforeOpenFn,
      afterOpen: afterOpenFn,
      open: openFn,
      afterClose: afterCloseFn,
      beforeClose: beforeCloseFn,
    });

    expect(route.isOpening).toBe(false);
    expect(route.isOpened).toBe(false);
    expect(route.params).toBeNull();
    expect(beforeOpenFn).toBeCalledTimes(0);
    expect(afterOpenFn).toBeCalledTimes(0);
    expect(beforeCloseFn).toBeCalledTimes(0);
    expect(afterCloseFn).toBeCalledTimes(0);
    expect(openFn).toBeCalledTimes(0);

    await route.open();

    expect(route.isOpening).toBe(false);
    expect(route.isOpened).toBe(true);
    expect(route.params).toEqual({});
    expect(beforeOpenFn).toBeCalledTimes(1);
    expect(afterOpenFn).toBeCalledTimes(1);
    expect(beforeCloseFn).toBeCalledTimes(0);
    expect(afterCloseFn).toBeCalledTimes(0);
    expect(openFn).toBeCalledTimes(1);

    expect(lifecycle).toEqual(['beforeOpen', 'open', 'afterOpen']);
  });

  it('route should complete full lyfecicle of open (with checkOpened + manual open)', async () => {
    const lifecycleHistory: string[] = [];

    const checkOpenedFn = vi.fn(() => {
      return history.locationUrl.startsWith('/foo');
    });
    const beforeOpenFn = vi.fn(() => {
      lifecycleHistory.push('beforeOpen');
    });
    const afterOpenFn = vi.fn(() => {
      lifecycleHistory.push('afterOpen');
    });
    const beforeCloseFn = vi.fn(() => {
      lifecycleHistory.push('beforeClose');
    });
    const afterCloseFn = vi.fn(() => {
      lifecycleHistory.push('afterClose');
    });
    const openFn = vi.fn(() => {
      lifecycleHistory.push('open');
      history.push('/foo');
    });

    const route = createVirtualRoute({
      checkOpened: checkOpenedFn,
      beforeOpen: beforeOpenFn,
      afterOpen: afterOpenFn,
      open: openFn,
      afterClose: afterCloseFn,
      beforeClose: beforeCloseFn,
    });

    expect(route.isOpened).toBe(false);
    expect(route.isOpening).toBe(false);
    expect(route.params).toBeNull();
    expect(beforeOpenFn).toBeCalledTimes(0);
    expect(afterOpenFn).toBeCalledTimes(0);
    expect(beforeCloseFn).toBeCalledTimes(0);
    expect(afterCloseFn).toBeCalledTimes(0);
    expect(openFn).toBeCalledTimes(0);

    await route.open();

    expect(route.isOpened).toBe(true);
    expect(route.isOpening).toBe(false);
    expect(route.params).toEqual({});
    expect(beforeOpenFn).toBeCalledTimes(1);
    expect(afterOpenFn).toBeCalledTimes(1);
    expect(beforeCloseFn).toBeCalledTimes(0);
    expect(afterCloseFn).toBeCalledTimes(0);
    expect(openFn).toBeCalledTimes(1);

    expect(lifecycleHistory).toEqual(['beforeOpen', 'open', 'afterOpen']);

    expect(checkOpenedFn).toBeCalledTimes(1);
    expect(checkOpenedFn).toHaveBeenNthCalledWith(1, route);
  });

  it('route should complete full lyfecicle of open (with checkOpened + auto open)', async () => {
    const lifecycleHistory: string[] = [];

    const checkOpenedFn = vi.fn(() => {
      return history.locationUrl.startsWith('/foo');
    });
    const beforeOpenFn = vi.fn(() => {
      lifecycleHistory.push('beforeOpen');
    });
    const afterOpenFn = vi.fn(() => {
      lifecycleHistory.push('afterOpen');
    });
    const beforeCloseFn = vi.fn(() => {
      lifecycleHistory.push('beforeClose');
    });
    const afterCloseFn = vi.fn(() => {
      lifecycleHistory.push('afterClose');
    });
    const openFn = vi.fn(() => {
      lifecycleHistory.push('open');
    });

    const route = createVirtualRoute({
      checkOpened: checkOpenedFn,
      beforeOpen: beforeOpenFn,
      afterOpen: afterOpenFn,
      open: openFn,
      afterClose: afterCloseFn,
      beforeClose: beforeCloseFn,
    });

    expect(route.isOpened).toBe(false);
    expect(route.isOpening).toBe(false);
    expect(route.params).toBeNull();
    expect(beforeOpenFn).toBeCalledTimes(0);
    expect(afterOpenFn).toBeCalledTimes(0);
    expect(beforeCloseFn).toBeCalledTimes(0);
    expect(afterCloseFn).toBeCalledTimes(0);
    expect(openFn).toBeCalledTimes(0);

    history.push('/foo');
    await when(() => history.locationUrl === '/foo');

    expect(route.isOpened).toBe(true);
    expect(route.isOpening).toBe(false);
    expect(route.params).toEqual({});
    expect(beforeOpenFn).toBeCalledTimes(1);
    expect(afterOpenFn).toBeCalledTimes(1);
    expect(beforeCloseFn).toBeCalledTimes(0);
    expect(afterCloseFn).toBeCalledTimes(0);
    expect(openFn).toBeCalledTimes(1);

    expect(lifecycleHistory).toEqual(['beforeOpen', 'open', 'afterOpen']);

    expect(checkOpenedFn).toBeCalledTimes(2);
    expect(checkOpenedFn).toHaveBeenNthCalledWith(1, route);
    expect(checkOpenedFn).toHaveBeenNthCalledWith(2, route);
  });
});

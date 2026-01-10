/** biome-ignore-all lint/nursery/noFloatingPromises: <explanation> */
import { when } from 'mobx';
import { createBrowserHistory } from 'mobx-location-history';
import {
  beforeAll,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  it,
  vi,
} from 'vitest';
import { sleep } from 'yummies/async';
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
    expect(route.params).toEqual(null);
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
    expect(route.params).toEqual(null);
    expect(beforeOpenFn).toBeCalledTimes(1);
    expect(afterOpenFn).toBeCalledTimes(1);
    expect(beforeCloseFn).toBeCalledTimes(0);
    expect(afterCloseFn).toBeCalledTimes(0);
    expect(openFn).toBeCalledTimes(1);

    expect(lifecycleHistory).toEqual(['beforeOpen', 'open', 'afterOpen']);

    expect(checkOpenedFn).toBeCalledTimes(3);
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
    expect(route.params).toEqual(null);
    expect(beforeOpenFn).toBeCalledTimes(1);
    expect(afterOpenFn).toBeCalledTimes(1);
    expect(beforeCloseFn).toBeCalledTimes(0);
    expect(afterCloseFn).toBeCalledTimes(0);
    expect(openFn).toBeCalledTimes(1);

    expect(lifecycleHistory).toEqual(['beforeOpen', 'open', 'afterOpen']);

    expect(checkOpenedFn).toBeCalledTimes(3);
    expect(checkOpenedFn).toHaveBeenNthCalledWith(1, route);
  });

  it('should handle route rejection in beforeOpen callback', async () => {
    const beforeOpenFn = vi.fn(() => false);
    const afterOpenFn = vi.fn();
    const openFn = vi.fn();

    const route = createVirtualRoute({
      beforeOpen: beforeOpenFn,
      afterOpen: afterOpenFn,
      open: openFn,
    });

    expect(route.isOpening).toBe(false);
    expect(route.isOpened).toBe(false);
    expect(route.params).toBeNull();

    await route.open();

    expect(route.isOpening).toBe(false);
    expect(route.isOpened).toBe(false);
    expect(route.params).toBeNull();
    expect(beforeOpenFn).toBeCalledTimes(1);
    expect(afterOpenFn).toBeCalledTimes(0);
    expect(openFn).toBeCalledTimes(0);
  });

  it('should handle route rejection in open callback', async () => {
    const beforeOpenFn = vi.fn();
    const afterOpenFn = vi.fn();
    const openFn = vi.fn(() => false);

    const route = createVirtualRoute({
      beforeOpen: beforeOpenFn,
      afterOpen: afterOpenFn,
      open: openFn,
    });

    expect(route.isOpening).toBe(false);
    expect(route.isOpened).toBe(false);
    expect(route.params).toBeNull();

    await route.open();

    expect(route.isOpening).toBe(false);
    expect(route.isOpened).toBe(false);
    expect(route.params).toBeNull();
    expect(beforeOpenFn).toBeCalledTimes(1);
    expect(afterOpenFn).toBeCalledTimes(0);
    expect(openFn).toBeCalledTimes(1);
  });

  it('should require params when TParams has required fields', async () => {
    const route = new VirtualRoute<{ id: string; name: string }>();

    await route.open({ id: '123', name: 'test' });

    expect(route.isOpened).toBe(true);
    expect(route.params).toEqual({ id: '123', name: 'test' });
  });

  it('should allow optional params when TParams has optional fields', async () => {
    const route = new VirtualRoute<{ id: string; name?: string }>();

    await route.open({ id: '123' });

    expect(route.isOpened).toBe(true);
    expect(route.params).toEqual({ id: '123' });

    await route.close();
    await route.open({ id: '456', name: 'test' });

    expect(route.isOpened).toBe(true);
    expect(route.params).toEqual({ id: '456', name: 'test' });
  });

  it('should enforce type safety for params with complex required structure', async () => {
    const route = new VirtualRoute<{
      user: { id: number; email: string };
      settings: { theme: string; notifications: boolean };
    }>();

    await route.open({
      user: { id: 123, email: 'test@example.com' },
      settings: { theme: 'dark', notifications: true },
    });

    expect(route.isOpened).toBe(true);
    expect(route.params).toEqual({
      user: { id: 123, email: 'test@example.com' },
      settings: { theme: 'dark', notifications: true },
    });
  });

  it('should handle route rejection in beforeClose callback', async () => {
    const beforeOpenFn = vi.fn();
    const afterOpenFn = vi.fn(() => {
      history.push('/foo');
    });
    const beforeCloseFn = vi.fn(() => false);
    const afterCloseFn = vi.fn();

    const route = createVirtualRoute({
      beforeOpen: beforeOpenFn,
      afterOpen: afterOpenFn,
      beforeClose: beforeCloseFn,
      afterClose: afterCloseFn,
    });

    await route.open();
    expect(route.isOpened).toBe(true);

    await route.close();

    expect(route.isOpening).toBe(false);
    expect(route.isClosing).toBe(false);
    expect(beforeOpenFn).toBeCalledTimes(1);
    expect(afterOpenFn).toBeCalledTimes(1);
    expect(beforeCloseFn).toBeCalledTimes(1);
    expect(afterCloseFn).toBeCalledTimes(0);
  });

  it('should properly handle query parameter updates during open', async () => {
    const route = new VirtualRoute<{}>();

    expect(route.query.data).toEqual({});

    await route.open({}, { query: { foo: 'bar' }, replace: false });

    expect(route.isOpened).toBe(true);
    expect(route.query.data).toEqual({ foo: 'bar' });
  });

  it('should properly handle params with complex types', async () => {
    const route = new VirtualRoute<{
      user: { id: number; name: string };
      items: string[];
    }>();

    const userData = { id: 123, name: 'John Doe' };
    const itemsData = ['item1', 'item2', 'item3'];

    await route.open({ user: userData, items: itemsData });

    expect(route.isOpened).toBe(true);
    expect(route.params).toEqual({ user: userData, items: itemsData });
  });

  it('should properly handle params with nested objects', async () => {
    const route = new VirtualRoute<{
      profile: {
        personal: { firstName: string; lastName: string };
        contact: { email: string; phone: string };
      };
    }>();

    const profileData = {
      personal: { firstName: 'Jane', lastName: 'Smith' },
      contact: { email: 'jane@example.com', phone: '123-456-7890' },
    };

    await route.open({ profile: profileData });

    expect(route.isOpened).toBe(true);
    expect(route.params).toEqual({ profile: profileData });
  });

  it('should properly handle params with optional properties', async () => {
    const route = new VirtualRoute<{
      id: string;
      name?: string;
      active?: boolean;
    }>();

    await route.open({ id: '123', name: 'Test User', active: true });

    expect(route.isOpened).toBe(true);
    expect(route.params).toEqual({
      id: '123',
      name: 'Test User',
      active: true,
    });

    await route.close();
    await route.open({ id: '456' });

    expect(route.isOpened).toBe(true);
    expect(route.params).toEqual({ id: '456' });
  });

  it('should properly handle route destruction', async () => {
    const route = new VirtualRoute<{}>();

    await route.open();
    expect(route.isOpened).toBe(true);

    route.destroy();

    expect(route.isOpened).toBe(false);
    expect(route.isOpening).toBe(false);
    expect(route.isClosing).toBe(false);
  });

  it('should handle concurrent open operations correctly', async () => {
    const route = new VirtualRoute<{}>();

    const promise1 = route.open();
    const promise2 = route.open();

    await Promise.all([promise1, promise2]);

    expect(route.isOpened).toBe(true);
    expect(route.isOpening).toBe(false);
  });

  it('should enforce type safety: required params when TParams has required fields', () => {
    const route = new VirtualRoute<{ id: string; name: string }>();

    expectTypeOf(route.open)
      .parameter(0)
      .toEqualTypeOf<{ id: string; name: string }>();
  });

  it('should enforce type safety: optional params when TParams has optional fields', () => {
    const route = new VirtualRoute<{ id: string; name?: string }>();

    expectTypeOf(route.open)
      .parameter(0)
      .toEqualTypeOf<{ id: string; name?: string }>();
  });

  it('should enforce type safety: complex required structure params', () => {
    const route = new VirtualRoute<{
      user: { id: number; email: string };
      settings: { theme: string; notifications: boolean };
    }>();

    expectTypeOf(route.open).parameter(0).toEqualTypeOf<{
      user: { id: number; email: string };
      settings: { theme: string; notifications: boolean };
    }>();
  });

  it('should handle empty params object correctly', async () => {
    const route = new VirtualRoute<{}>();

    await route.open({});

    expect(route.isOpened).toBe(true);
    expect(route.params).toEqual({});

    await route.close();
    expect(route.isOpened).toBe(false);
  });

  it('should handle null params correctly', async () => {
    const route = new VirtualRoute<{}>();

    await route.open(null as any);

    expect(route.isOpened).toBe(true);
    expect(route.params).toBeNull();

    await route.close();
    expect(route.isOpened).toBe(false);
  });

  it('should handle undefined params correctly', async () => {
    const route = new VirtualRoute<{}>();

    await route.open(undefined as any);

    expect(route.isOpened).toBe(true);
    expect(route.params).toBeNull();

    await route.close();
    expect(route.isOpened).toBe(false);
  });

  it('should properly handle deeply nested object parameters', async () => {
    const route = new VirtualRoute<{
      data: {
        user: {
          profile: {
            personal: {
              firstName: string;
              lastName: string;
            };
            contact: {
              email: string;
              phone: string;
            };
          };
        };
      };
    }>();

    const deepData = {
      data: {
        user: {
          profile: {
            personal: {
              firstName: 'John',
              lastName: 'Doe',
            },
            contact: {
              email: 'john@example.com',
              phone: '123-456-7890',
            },
          },
        },
      },
    };

    await route.open(deepData);

    expect(route.isOpened).toBe(true);
    expect(route.params).toEqual(deepData);
  });

  it('should properly handle array parameters with complex types', async () => {
    const route = new VirtualRoute<{
      items: Array<{ id: number; name: string; tags: string[] }>;
      metadata: { count: number; total: number };
    }>();

    const complexItems = [
      { id: 1, name: 'Item 1', tags: ['tag1', 'tag2'] },
      { id: 2, name: 'Item 2', tags: ['tag3'] },
    ];

    const metadata = { count: 2, total: 10 };

    await route.open({ items: complexItems, metadata });

    expect(route.isOpened).toBe(true);
    expect(route.params).toEqual({ items: complexItems, metadata });
  });

  it('route should be opened at start of creation', async () => {
    vi.useFakeTimers();

    history.push('/foo');

    const checkOpened = vi.fn(() => {
      return history.location.pathname === '/foo';
    });

    const route = new VirtualRoute({
      checkOpened,
    });
    expect(route.isOpened).toBe(true);

    sleep(10);
    await vi.runAllTimersAsync();

    expect(checkOpened).toBeCalledTimes(2);
  });

  it('route should not be opened at start of creation', async () => {
    vi.useFakeTimers();
    history.push('/foo');
    const checkOpenedFn = vi.fn(() => history.location.pathname === '/bar');
    const route = new VirtualRoute({
      checkOpened: checkOpenedFn,
    });
    expect(route.isOpened).toBe(false);
    sleep(10);
    await vi.runAllTimersAsync();
    expect(checkOpenedFn).toBeCalledTimes(2);
  });

  it('count of checkOpened function calls due to isOpened getter usage', async () => {
    vi.useFakeTimers();

    history.push('/foo');

    const checkOpened = vi.fn(() => {
      return history.location.pathname === '/foo';
    });

    const route = new VirtualRoute({
      checkOpened,
    });
    expect(checkOpened).toBeCalledTimes(2);
    expect(route.isOpened).toBe(true);
    expect(route.isOpened).toBe(true);
    expect(route.isOpened).toBe(true);
    expect(checkOpened).toBeCalledTimes(2);

    sleep(10);
    await vi.runAllTimersAsync();

    expect(checkOpened).toBeCalledTimes(2);

    history.push('/bar');
    expect(checkOpened).toBeCalledTimes(3);
    expect(route.isOpened).toBe(false);
    expect(route.isOpened).toBe(false);
    expect(route.isOpened).toBe(false);
    expect(checkOpened).toBeCalledTimes(3);

    sleep(10);
    await vi.runAllTimersAsync();

    expect(checkOpened).toBeCalledTimes(3);
    expect(route.isOpened).toBe(false);
    expect(route.isOpened).toBe(false);
    expect(route.isOpened).toBe(false);
    expect(checkOpened).toBeCalledTimes(3);

    sleep(10);
    await vi.runAllTimersAsync();

    expect(checkOpened).toBeCalledTimes(3);
  });

  it('should be called afterOpen if route is opened at start', async () => {
    vi.useFakeTimers();

    history.push('/foo?modal=new-thing');

    const afterOpenFn = vi.fn();

    const route = createVirtualRoute({
      checkOpened: (it) => it.query.data.modal === 'new-thing',
      open: (_, it) => it.query.update({ modal: 'new-thing' }),
      close: (it) => it.query.update({ modal: null }),
      afterOpen: afterOpenFn,
    });

    expect(route.isOpened).toBe(true);
    expect(route.isOpening).toBe(false);
    expect(afterOpenFn).toBeCalledTimes(1);
  });

  it('close virtual route in after open handler', async () => {
    vi.useFakeTimers();

    history.push('/foo?modal=new-thing');

    const afterOpenFn = vi.fn(() => {
      setTimeout(() => {
        route.close();
      }, 400);
    });

    const route = createVirtualRoute({
      checkOpened: (it) => it.query.data.modal === 'new-thing',
      open: (_, it) => it.query.update({ modal: 'new-thing' }),
      close: (it) => it.query.update({ modal: null }),
      afterOpen: afterOpenFn,
    });

    expect(route.isOpened).toBe(true);
    expect(route.isOpening).toBe(false);

    await vi.runAllTimersAsync();

    expect(route.isOpened).toBe(false);
  });
});

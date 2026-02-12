import { beforeEach, describe, expect, it, vi } from 'vitest';
import { routeConfig } from '../config/config.js';
import { createRoute } from '../route/route.js';
import { createVirtualRoute } from '../virtual-route/virtual-route.js';
import { groupRoutes, RouteGroup } from './route-group.js';

describe('route-group', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    routeConfig.get().history.replace('/', null);
    globalThis.history.replaceState(null, '', '/');
    window.history.replaceState(null, '', '/');
  });

  it('groupRoutes should create RouteGroup instance', () => {
    const homeRoute = createRoute('/');
    const aboutRoute = createRoute('/about');

    const group = groupRoutes({
      home: homeRoute,
      about: aboutRoute,
    });

    expect(group).toBeInstanceOf(RouteGroup);
    expect(group.routes.home).toBe(homeRoute);
    expect(group.routes.about).toBe(aboutRoute);
  });

  it('indexRoute should use explicit index route argument', () => {
    const routesIndexRoute = createRoute('/by-group', { index: true });
    const explicitIndexRoute = createVirtualRoute();

    const group = groupRoutes(
      {
        routesIndexRoute,
      },
      explicitIndexRoute,
    );

    expect(group.indexRoute).toBe(explicitIndexRoute);
  });

  it('isOpened should be true for opened child route', () => {
    const openedVirtualRoute = createVirtualRoute({
      checkOpened: () => true,
    });

    const group = groupRoutes({
      closed: createVirtualRoute({
        checkOpened: () => false,
      }),
      opened: openedVirtualRoute,
    });

    expect(group.isOpened).toBe(true);
  });

  it('isOpened should be true for route with opened children', () => {
    const parentRoute = createRoute('/parent', { exact: true });
    parentRoute.extend('/child');
    routeConfig.get().history.push('/parent/child', null);

    const group = groupRoutes({
      nested: parentRoute,
    });

    expect(parentRoute.isOpened).toBe(false);
    expect(parentRoute.hasOpenedChildren).toBe(true);
    expect(group.isOpened).toBe(true);
  });

  it('open should delegate to index route with args', () => {
    const indexRoute = createRoute('/users/:id', { index: true });
    const openSpy = vi.spyOn(indexRoute, 'open').mockResolvedValue(undefined);

    const group = groupRoutes({
      index: indexRoute,
      details: createRoute('/users'),
    });

    group.open({ id: 42 }, { replace: true });

    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(openSpy).toHaveBeenCalledWith({ id: 42 }, { replace: true });
  });

  it('open should delegate to last nested group when index route is missing', () => {
    const firstGroup = groupRoutes({
      index: createRoute('/a', { index: true }),
    });
    const secondGroup = groupRoutes({
      index: createRoute('/b', { index: true }),
    });
    const firstGroupOpenSpy = vi
      .spyOn(firstGroup, 'open')
      .mockImplementation(() => {});
    const secondGroupOpenSpy = vi
      .spyOn(secondGroup, 'open')
      .mockImplementation(() => {});

    const parentGroup = groupRoutes({
      firstGroup,
      secondGroup,
    });

    parentGroup.open('foo');

    expect(firstGroupOpenSpy).not.toHaveBeenCalled();
    expect(secondGroupOpenSpy).toHaveBeenCalledTimes(1);
    expect(secondGroupOpenSpy).toHaveBeenCalledWith('foo');
  });

  it('open should warn when no index route and no nested groups exist', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const group = groupRoutes({
      foo: createVirtualRoute(),
      bar: createVirtualRoute(),
    });

    group.open();

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      "RouteGroup doesn't have index route. open() method doesn't work.",
    );
  });
});

import type { AnyAbstractRouteEntity } from 'mobx-route';

export function isRouteActive(route: AnyAbstractRouteEntity): boolean {
  if (route.isOpened || ('isOpening' in route && route.isOpening)) {
    return true;
  }

  return 'routes' in route && Object.values(route.routes).some(isRouteActive);
}

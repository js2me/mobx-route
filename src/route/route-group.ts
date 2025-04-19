import { computed, makeObservable, observable } from 'mobx';

import { AnyRouteGroup } from './route-group.types.js';
import { AnyRoute } from './route.types.js';
import { VirtualRoute } from './virtual-route.js';

export class RouteGroup<
  TGrouppedRoutes extends Record<
    string,
    AnyRoute | AnyRouteGroup | VirtualRoute
  >,
> {
  constructor(public routes: TGrouppedRoutes) {
    computed.struct(this, 'isMatches');
    observable.shallow(this, 'routes');
    makeObservable(this);
  }

  get isOpened(): boolean {
    const routes = Object.values(this.routes);
    return routes.some((route) => route.isOpened);
  }

  open(...args: any[]) {
    let lastGroupRoute: RouteGroup<any> | undefined;

    for (const routeName in this.routes) {
      const route = this.routes[routeName];
      if (route instanceof RouteGroup) {
        lastGroupRoute = route;
      } else if ('isIndex' in route && route.isIndex) {
        route.open(...args);
        return;
      }
    }

    if (lastGroupRoute) {
      lastGroupRoute.open();
    }
  }
}

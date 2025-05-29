import { computed, makeObservable, observable } from 'mobx';

import { AnyRouteEntity, RoutesCollection } from './route-group.types.js';

declare const process: { env: { NODE_ENV?: string } };

/**
 * Class for grouping related routes and managing their state.
 *
 * [**Documentation**](https://js2me.github.io/mobx-route/core/RouteGroup.html)
 */
export class RouteGroup<TRoutesCollection extends RoutesCollection> {
  routes: TRoutesCollection;

  constructor(
    routes: TRoutesCollection,
    private _indexRoute?: AnyRouteEntity,
  ) {
    this.routes = routes;

    computed.struct(this, 'isOpened');
    computed.struct(this, 'indexRoute');
    observable.shallow(this, 'routes');
    makeObservable(this);
  }

  /**
   * Returns true if at least one route in the group is open.
   *
   * [**Documentation**](https://js2me.github.io/mobx-route/core/RouteGroup.html#isopened-boolean)
   */
  get isOpened(): boolean {
    const routes = Object.values(this.routes);
    return routes.some(
      (route) =>
        route.isOpened ||
        ('hasOpenedChildren' in route && route.hasOpenedChildren),
    );
  }

  /**
   * First found index route.
   *
   * [**Documentation**](https://js2me.github.io/mobx-route/core/RouteGroup.html#indexroute-route-undefined)
   */
  get indexRoute(): AnyRouteEntity | undefined {
    return (
      this._indexRoute ??
      Object.values(this.routes).find(
        (route) => 'isIndex' in route && route.isIndex,
      )
    );
  }

  /**
   * Main navigation method for the group.
   *
   * [**Documentation**](https://js2me.github.io/mobx-route/core/RouteGroup.html#open-args-any-void)
   */
  open(...args: any[]) {
    let lastGroupRoute: RouteGroup<any> | undefined;

    if (this.indexRoute) {
      this.indexRoute.open(...args);
      return;
    }

    for (const routeName in this.routes) {
      const route = this.routes[routeName];
      if (route instanceof RouteGroup) {
        lastGroupRoute = route;
      }
    }

    if (lastGroupRoute) {
      lastGroupRoute.open(...args);
    } else if (process.env.NODE_ENV !== 'production') {
      console.warn(
        "RouteGroup doesn't have index route. open() method doesn't work.",
      );
    }
  }
}

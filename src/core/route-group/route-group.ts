import { computed, observable } from 'mobx';
import { applyObservable, type ObservableAnnotationsArray } from 'yummies/mobx';
import type {
  AbstractRouteGroup,
  AnyRouteEntity,
  RoutesCollection,
} from './route-group.types.js';

declare const process: { env: { NODE_ENV?: string } };

const annotations: ObservableAnnotationsArray<RouteGroup<any>> = [
  [computed, 'isOpened', 'indexRoute'],
  [observable.shallow, 'routes'],
];

/**
 * Class for grouping related routes and managing their state.
 *
 * [**Documentation**](https://js2me.github.io/mobx-route/core/RouteGroup.html)
 */
export class RouteGroup<TRoutesCollection extends RoutesCollection>
  implements AbstractRouteGroup<TRoutesCollection>
{
  routes: TRoutesCollection;

  constructor(
    routes: TRoutesCollection,
    private _indexRoute?: AnyRouteEntity,
  ) {
    this.routes = routes;

    applyObservable(this, annotations);
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
    return (this._indexRoute ??
      Object.values(this.routes).find(
        (route) => 'isIndex' in route && route.isIndex,
      )) as unknown as AnyRouteEntity;
  }

  /**
   * Main navigation method for the group.
   *
   * [**Documentation**](https://js2me.github.io/mobx-route/core/RouteGroup.html#open-args-any-void)
   */
  open(...args: any[]) {
    let lastGroupRoute: RouteGroup<any> | undefined;

    if (this.indexRoute && 'open' in this.indexRoute) {
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

export const createRouteGroup = <TRoutesCollection extends RoutesCollection>(
  routes: TRoutesCollection,
  indexRoute?: AnyRouteEntity,
) => new RouteGroup<TRoutesCollection>(routes, indexRoute);

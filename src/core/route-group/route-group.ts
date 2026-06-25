import { computed, observable } from 'mobx';
import { applyObservable, type ObservableAnnotationsArray } from 'yummies/mobx';
import type {
  AbstractRouteGroup,
  AnyRouteEntity,
  RoutesCollection,
} from './route-group.types.js';

declare const process: { env: { NODE_ENV?: string } };

const annotations: ObservableAnnotationsArray<RouteGroup<any>> = [
  [computed, 'isOpened', 'indexRoute', 'canNavigate'],
  [observable.shallow, 'routes'],
];

/**
 * Class for grouping related routes and managing their state.
 *
 * [**Documentation**](https://js2me.github.io/mobx-route/core/groupRoutes.html)
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
   * [**Documentation**](https://js2me.github.io/mobx-route/core/groupRoutes.html#isopened)
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
   * [**Documentation**](https://js2me.github.io/mobx-route/core/groupRoutes.html#indexroute)
   */
  get indexRoute(): AnyRouteEntity | undefined {
    return (this._indexRoute ??
      Object.values(this.routes).find(
        (route) => 'isIndex' in route && route.isIndex,
      )) as unknown as AnyRouteEntity;
  }

  /**
   * `true` if `open()` has a target to navigate to —
   * either an own index route or a nested `RouteGroup` that itself can navigate.
   *
   * [**Documentation**](https://js2me.github.io/mobx-route/core/groupRoutes.html#cannavigate)
   */
  get canNavigate(): boolean {
    if (this.indexRoute) return true;

    for (const routeName in this.routes) {
      const route = this.routes[routeName];
      if (route instanceof RouteGroup && route.canNavigate) {
        return true;
      }
    }

    return false;
  }

  /**
   * Main navigation method for the group.
   *
   * [**Documentation**](https://js2me.github.io/mobx-route/core/groupRoutes.html#open)
   */
  open(...args: any[]) {
    if (this.indexRoute && 'open' in this.indexRoute) {
      this.indexRoute.open(...args);
      return;
    }

    for (const routeName in this.routes) {
      const route = this.routes[routeName];
      if (route instanceof RouteGroup && route.canNavigate) {
        route.open(...args);
        return;
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        'Warning #1: RouteGroup.open() cannot navigate\n' +
          'This group has no index route (`index: true` or `groupRoutes(routes, indexRoute)`) and no navigable nested RouteGroup, so open() does nothing.\n' +
          'See docs: https://js2me.github.io/mobx-route/warnings/1',
      );
    } else {
      console.warn('minified warning #1;see mobx-route docs');
    }
  }
}

/**
 * Helper for creating route groups.
 *
 * [**Documentation**](https://js2me.github.io/mobx-route/core/groupRoutes.html)
 */
export const groupRoutes = <TRoutesCollection extends RoutesCollection>(
  routes: TRoutesCollection,
  indexRoute?: AnyRouteEntity,
) => new RouteGroup<TRoutesCollection>(routes, indexRoute);

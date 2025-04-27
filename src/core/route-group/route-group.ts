import { computed, makeObservable, observable } from 'mobx';

import { RouteNavigateParams } from '../route/index.js';

import { RoutesCollection } from './route-group.types.js';

declare const process: { env: { NODE_ENV?: string } };

export class RouteGroup<TRoutesCollection extends RoutesCollection> {
  constructor(public routes: TRoutesCollection) {
    computed.struct(this, 'isMatches');
    observable.shallow(this, 'routes');
    makeObservable(this);
  }

  get isOpened(): boolean {
    const routes = Object.values(this.routes);
    return routes.some((route) => route.isOpened);
  }

  open(params?: any, navigateParams?: RouteNavigateParams) {
    let lastGroupRoute: RouteGroup<any> | undefined;

    for (const routeName in this.routes) {
      const route = this.routes[routeName];
      if (route instanceof RouteGroup) {
        lastGroupRoute = route;
      } else if ('isIndex' in route && route.isIndex) {
        route.open(params, navigateParams);
        return;
      }
    }

    if (lastGroupRoute) {
      lastGroupRoute.open(params, navigateParams);
    } else if (process.env.NODE_ENV !== 'production') {
      console.warn(
        "RouteGroup doesn't have index route. open() method doesn't work.",
      );
    }
  }
}

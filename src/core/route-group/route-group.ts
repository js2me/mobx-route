import { computed, makeObservable, observable } from 'mobx';

import { RouteNavigateParams } from '../route/index.js';

import { RoutesCollection } from './route-group.types.js';

declare const process: { env: { NODE_ENV?: string } };

export class RouteGroup<TRoutesCollection extends RoutesCollection> {
  constructor(public routes: TRoutesCollection) {
    computed.struct(this, 'isMatches');
    computed.struct(this, 'indexRoute');
    observable.shallow(this, 'routes');
    makeObservable(this);
  }

  get isOpened(): boolean {
    const routes = Object.values(this.routes);
    return routes.some((route) => route.isOpened);
  }

  get indexRoute() {
    return Object.values(this.routes).find(
      (route) => 'isIndex' in route && route.isIndex,
    );
  }

  open(params?: any, navigateParams?: RouteNavigateParams) {
    let lastGroupRoute: RouteGroup<any> | undefined;

    if (this.indexRoute) {
      this.indexRoute.open(params, navigateParams);
      return;
    }

    for (const routeName in this.routes) {
      const route = this.routes[routeName];
      if (route instanceof RouteGroup) {
        lastGroupRoute = route;
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

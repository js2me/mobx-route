import { computed, makeObservable, observable } from 'mobx';

import { AnyRoute } from './route.types.js';

export class RouteGroup<TGrouppedRoutes extends Record<string, AnyRoute>> {
  constructor(public routes: TGrouppedRoutes) {
    computed.struct(this, 'isMatches');
    observable.shallow(this, 'routes');
    makeObservable(this);
  }

  get isMatches() {
    const routes = Object.values(this.routes);
    return routes.some((route) => route.isMatches);
  }
}

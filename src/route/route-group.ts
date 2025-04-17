import { computed, makeObservable, observable } from 'mobx';

import { AnyRouteGroup } from './route-group.types.js';
import { AnyRoute } from './route.types.js';

export class RouteGroup<
  TGrouppedRoutes extends Record<string, AnyRoute | AnyRouteGroup>,
> {
  constructor(public routes: TGrouppedRoutes) {
    computed.struct(this, 'isMatches');
    observable.shallow(this, 'routes');
    makeObservable(this);
  }

  get isMatches(): boolean {
    const routes = Object.values(this.routes);
    return routes.some((route) => route.isMatches);
  }
}

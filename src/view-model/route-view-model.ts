import { computed } from 'mobx';
import {
  type AnyAbstractRouteEntity,
  type IQueryParams,
  Route,
  type RouteParams,
  routeConfig,
  VirtualRoute,
} from 'mobx-route';
import {
  applyObservable,
  ViewModelBase,
  type ViewModelParams,
} from 'mobx-view-model';
import type { EmptyObject } from 'yummies/types';

export abstract class RouteViewModel<
  TRoute extends AnyAbstractRouteEntity = AnyAbstractRouteEntity,
> extends ViewModelBase<EmptyObject> {
  abstract readonly route: TRoute;

  constructor(params: ViewModelParams<EmptyObject, any>) {
    super(params);

    applyObservable(
      this,
      [
        ['pathParams', computed.struct],
        ['query', computed],
      ],
      this.vmConfig.observable.viewModelStores,
    );
  }

  override get payload(): RouteParams<TRoute> {
    if (this.route instanceof Route) {
      return this.route.params || ({} as any);
    }

    if (this.route instanceof VirtualRoute) {
      return this.route.params as any;
    }

    return {} as EmptyObject as any;
  }

  get query(): IQueryParams {
    if ('query' in this.route) {
      return this.route.query as IQueryParams;
    }

    return routeConfig.get().queryParams;
  }

  get pathParams() {
    return this.payload;
  }

  get isMounted() {
    return super.isMounted && this.route.isOpened;
  }
}

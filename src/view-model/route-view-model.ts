import { computed } from 'mobx';
import {
  type AnyAbstractRouteEntity,
  type IQueryParams,
  type RouteParams,
  routeConfig,
} from 'mobx-route';
import {
  applyObservable,
  ViewModelBase,
  type ViewModelParams,
} from 'mobx-view-model';
import type { ObservableAnnotationsArray } from 'yummies/mobx';
import type { EmptyObject } from 'yummies/types';

const annotations: ObservableAnnotationsArray<RouteViewModel<any>> = [
  [computed.struct, 'pathParams'],
  [computed, 'query'],
];

export abstract class RouteViewModel<
  TRoute extends AnyAbstractRouteEntity = AnyAbstractRouteEntity,
> extends ViewModelBase<EmptyObject> {
  /**
   * Route entity bound to this view model.
   *
   * [**Documentation**](https://js2me.github.io/mobx-route/view-model/RouteViewModel#route)
   */
  abstract readonly route: TRoute;
  /**
   * Caches the latest known route params.
   */
  protected lastPayload: RouteParams<TRoute> = {} as any;

  constructor(params: ViewModelParams<EmptyObject, any>) {
    super(params);

    applyObservable(this, annotations, this.vmConfig.observable.viewModels);
  }

  /**
   * Current route params with fallback to the last cached value.
   */
  override get payload(): RouteParams<TRoute> {
    if ('params' in this.route && this.route.params != null) {
      this.lastPayload = this.route.params as RouteParams<TRoute>;
    }

    return this.lastPayload;
  }

  /**
   * Current query params from route or global route config.
   *
   * [**Documentation**](https://js2me.github.io/mobx-route/view-model/RouteViewModel#query)
   */
  get query(): IQueryParams {
    if ('query' in this.route) {
      return this.route.query as IQueryParams;
    }

    return routeConfig.get().queryParams;
  }

  /**
   * Alias for `payload`.
   *
   * [**Documentation**](https://js2me.github.io/mobx-route/view-model/RouteViewModel#pathparams)
   */
  get pathParams() {
    return this.payload;
  }

  /**
   * Mounted state including the route opened status.
   */
  get isMounted() {
    return super.isMounted && this.route.isOpened;
  }
}

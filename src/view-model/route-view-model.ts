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
  abstract readonly route: TRoute;
  protected lastPayload: RouteParams<TRoute> = {} as any;

  constructor(params: ViewModelParams<EmptyObject, any>) {
    super(params);

    applyObservable(this, annotations, this.vmConfig.observable.viewModels);
  }

  override get payload(): RouteParams<TRoute> {
    if ('params' in this.route && this.route.params != null) {
      this.lastPayload = this.route.params as RouteParams<TRoute>;
    }

    return this.lastPayload;
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

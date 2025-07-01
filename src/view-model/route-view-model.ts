import { computed } from 'mobx';
import {
  applyObservable,
  ViewModelBase,
  ViewModelParams,
} from 'mobx-view-model';
import { AnyObject, EmptyObject } from 'yummies/utils/types';

import {
  routeConfig,
  Route,
  ParsedPathParams,
  VirtualRoute,
  AnyAbstractRouteEntity,
} from '../core/index.js';

export abstract class RouteViewModel<
  TRoute extends AnyAbstractRouteEntity = AnyAbstractRouteEntity,
> extends ViewModelBase<AnyObject> {
  abstract readonly route: TRoute;

  constructor(params: ViewModelParams<any, any>) {
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

  override get payload(): TRoute extends Route<string, any>
    ? ParsedPathParams<TRoute['path']>
    : TRoute extends VirtualRoute<infer Params>
      ? Params
      : EmptyObject {
    if (this.route instanceof Route) {
      return this.route.params || ({} as any);
    }

    if (this.route instanceof VirtualRoute) {
      return this.route.params as any;
    }

    return {} as EmptyObject as any;
  }

  get query() {
    if ('query' in this.route) {
      return this.route.query;
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

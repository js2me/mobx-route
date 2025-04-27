import { computed, makeObservable } from 'mobx';
import { ViewModelBase, ViewModelParams } from 'mobx-view-model';
import { AnyObject, EmptyObject } from 'yummies/utils/types';

import {
  routeConfig,
  Route,
  ParsedPathParams,
  AnyRouteEntity,
  VirtualRoute,
} from '../core/index.js';

export abstract class RouteViewModel<
  TRoute extends AnyRouteEntity = AnyRouteEntity,
> extends ViewModelBase<AnyObject> {
  abstract readonly route: TRoute;

  constructor(params: ViewModelParams<any, any>) {
    super(params);

    computed.struct(this, 'pathParams');
    computed(this, 'query');

    makeObservable(this);
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
}

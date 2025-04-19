import { action, computed, makeObservable, observable } from 'mobx';
import { IQueryParams } from 'mobx-location-history';
import { FnValue, resolveFnValue } from 'yummies/common';
import {
  AllPropertiesOptional,
  AnyObject,
  EmptyObject,
  Maybe,
} from 'yummies/utils/types';

import { routeConfig } from './config.js';
import { VirtualRouteConfiguration } from './virtual-route.types.js';

export class VirtualRoute<
  TParams extends AnyObject | EmptyObject = EmptyObject,
> {
  query: IQueryParams;
  params: TParams;

  constructor(
    private isOpenedResolver?: FnValue<boolean, [query: IQueryParams['data']]>,
    protected config: VirtualRouteConfiguration = {},
  ) {
    this.query = config.queryParams ?? routeConfig.get().queryParams;
    this.params = {} as TParams;

    observable(this, 'params');
    observable.ref(this, 'isOpenedResolver');
    computed.struct(this, 'isOpened');
    action(this, 'open');
    action(this, 'close');
    makeObservable(this);
  }

  get isOpened() {
    return (
      this.isOpenedResolver != null &&
      resolveFnValue(this.isOpenedResolver, this.query.data)
    );
  }

  setResolver(isOpenedResolver: FnValue<boolean>) {
    this.isOpenedResolver = isOpenedResolver;
  }

  open(
    ...args: AllPropertiesOptional<TParams> extends true
      ? [params?: Maybe<TParams>, query?: AnyObject]
      : [params: TParams, query?: AnyObject]
  ): void;
  open(...args: any[]) {
    this.params = args[0] ?? {};
    if (args[1] != null) {
      this.query.update(args[1]);
    }
    this.isOpenedResolver = true;
  }

  close() {
    this.isOpenedResolver = false;
  }
}

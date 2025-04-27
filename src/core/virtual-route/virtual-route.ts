import { action, computed, makeObservable, observable } from 'mobx';
import { IQueryParams } from 'mobx-location-history';
import { FnValue, resolveFnValue } from 'yummies/common';
import {
  AllPropertiesOptional,
  AnyObject,
  EmptyObject,
  Maybe,
} from 'yummies/utils/types';

import { routeConfig } from '../config/index.js';

import { VirtualRouteConfiguration } from './virtual-route.types.js';

export class VirtualRoute<
  TParams extends AnyObject | EmptyObject = EmptyObject,
> {
  query: IQueryParams;
  params: TParams;

  private checkOpened: FnValue<boolean, [route: this]>;

  constructor(protected config: VirtualRouteConfiguration<TParams> = {}) {
    this.query = config.queryParams ?? routeConfig.get().queryParams;
    this.params = (config.initialParams ?? {}) as TParams;
    this.checkOpened = config.checkOpened as any;

    observable(this, 'params');
    observable.ref(this, 'checkOpened');
    computed.struct(this, 'isOpened');
    action(this, 'open');
    action(this, 'close');
    makeObservable(this);
  }

  get isOpened() {
    return this.checkOpened != null && resolveFnValue(this.checkOpened, this);
  }

  setResolver(checkOpened: FnValue<boolean>) {
    this.checkOpened = checkOpened;
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

    if (this.config.open == null) {
      this.checkOpened = true;
    } else {
      this.checkOpened = this.config.open(this.params, this);
    }
  }

  close() {
    if (this.config.close != null) {
      this.checkOpened = this.config.close(this);
      return;
    }

    this.checkOpened = false;
  }
}

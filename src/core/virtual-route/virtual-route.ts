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

  private checkOpened: VirtualRouteConfiguration<TParams>['checkOpened'];

  constructor(protected config: VirtualRouteConfiguration = {}) {
    this.query = config.queryParams ?? routeConfig.get().queryParams;
    this.params = {} as TParams;
    this.checkOpened = config.checkOpened;

    observable(this, 'params');
    observable.ref(this, 'checkOpened');
    computed.struct(this, 'isOpened');
    action(this, 'open');
    action(this, 'close');
    makeObservable(this);
  }

  get isOpened() {
    return (
      this.checkOpened != null &&
      resolveFnValue(this.checkOpened, this.query.data)
    );
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
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      this.checkOpened = this.config.open(...args);
    }
  }

  close() {
    if (this.config.close != null) {
      this.checkOpened = this.config.close(this.query.data);
      return;
    }

    this.checkOpened = false;
  }
}

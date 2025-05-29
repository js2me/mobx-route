import { LinkedAbortController } from 'linked-abort-controller';
import { action, computed, makeObservable, observable, reaction } from 'mobx';
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

/**
 * Class for creating routes with custom activation logic
 *
 * [**Documentation**](https://js2me.github.io/mobx-route/core/VirtualRoute.html)
 */
export class VirtualRoute<
  TParams extends AnyObject | EmptyObject = EmptyObject,
> extends String {
  protected abortController: AbortController;
  query: IQueryParams;
  params: TParams | null;

  private checkOpened: FnValue<boolean, [route: this]>;

  constructor(protected config: VirtualRouteConfiguration<TParams> = {}) {
    super(config.stringContent);

    this.abortController = new LinkedAbortController(config.abortSignal);
    this.query = config.queryParams ?? routeConfig.get().queryParams;
    this.params = resolveFnValue(config.initialParams, this) ?? null;
    this.checkOpened = config.checkOpened as any;

    observable(this, 'params');
    observable.ref(this, 'checkOpened');
    computed.struct(this, 'isOpened');
    action(this, 'open');
    action(this, 'close');
    makeObservable(this);

    if (config.onOpen || config.onClose) {
      let firstReactionCall = true;

      reaction(
        () => this.isOpened,
        (isOpened) => {
          if (firstReactionCall) {
            firstReactionCall = false;
            // ignore first 'onClose' callback call
            if (!isOpened) {
              return;
            }
          }

          if (isOpened) {
            config.onOpen?.(this.params!, this);
          } else {
            config.onClose?.();
          }
        },
        {
          signal: this.abortController.signal,
          fireImmediately: true,
        },
      );
    }
  }

  /**
   * [**Documentation**](https://js2me.github.io/mobx-route/core/VirtualRoute.html#isopened-boolean)
   */
  get isOpened() {
    return this.checkOpened != null && resolveFnValue(this.checkOpened, this);
  }

  /**
   * [**Documentation**](https://js2me.github.io/mobx-route/core/VirtualRoute.html#setresolver-checkopened-void)
   */
  setResolver(checkOpened: FnValue<boolean>) {
    this.checkOpened = checkOpened;
  }

  /**
   * [**Documentation**](https://js2me.github.io/mobx-route/core/VirtualRoute.html#open-params-query-void)
   */
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
      this.checkOpened = this.config.open(this.params!, this);
    }
  }

  /**
   * [**Documentation**](https://js2me.github.io/mobx-route/core/VirtualRoute.html#close-void)
   */
  close() {
    if (this.config.close != null) {
      this.checkOpened = this.config.close(this);
      return;
    }

    this.checkOpened = false;
  }

  destroy() {
    this.abortController.abort();
  }
}

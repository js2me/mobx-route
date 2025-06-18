import { LinkedAbortController } from 'linked-abort-controller';
import {
  action,
  computed,
  IObservableValue,
  makeObservable,
  observable,
  reaction,
  runInAction,
} from 'mobx';
import { IQueryParams } from 'mobx-location-history';
import { callFunction } from 'yummies/common';
import {
  AllPropertiesOptional,
  AnyObject,
  EmptyObject,
  Maybe,
} from 'yummies/utils/types';

import { routeConfig } from '../config/index.js';

import {
  VirtualOpenExtraParams,
  VirtualRouteConfiguration,
} from './virtual-route.types.js';

/**
 * Class for creating routes with custom activation logic
 *
 * [**Documentation**](https://js2me.github.io/mobx-route/core/VirtualRoute.html)
 */
export class VirtualRoute<
  TParams extends AnyObject | EmptyObject = EmptyObject,
> {
  protected abortController: AbortController;
  query: IQueryParams;
  params: TParams | null;

  private isLocalOpened: IObservableValue<boolean>;

  private openChecker: Maybe<VirtualRouteConfiguration<TParams>['checkOpened']>;

  constructor(protected config: VirtualRouteConfiguration<TParams> = {}) {
    this.abortController = new LinkedAbortController(config.abortSignal);
    this.query = config.queryParams ?? routeConfig.get().queryParams;
    this.params = callFunction(config.initialParams, this) ?? null;
    this.openChecker = config.checkOpened;
    this.isLocalOpened = observable.box(this.openChecker?.(this) ?? false);

    observable(this, 'params');
    observable.ref(this, '_isOpened');
    computed.struct(this, 'isOpened');
    action(this, 'setOpenChecker');
    action(this, 'open');
    action(this, 'close');
    makeObservable(this);

    if (config.afterOpen || config.afterClose) {
      let firstReactionCall = true;

      reaction(
        () => this.isOpened,
        (isOpened) => {
          if (firstReactionCall) {
            firstReactionCall = false;
            // ignore first 'afterClose' callback call
            if (!isOpened) {
              return;
            }
          }

          if (isOpened) {
            config.afterOpen?.(this.params!, this);
          } else {
            config.afterClose?.();
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
    const isOuterOpened = this.openChecker == null || this.openChecker(this);
    return this.isLocalOpened.get() && isOuterOpened;
  }

  /**
   * [**Documentation**](https://js2me.github.io/mobx-route/core/VirtualRoute.html#setopenchecker-openchecker-void)
   */
  setOpenChecker(
    openChecker: Maybe<VirtualRouteConfiguration<TParams>['checkOpened']>,
  ) {
    this.openChecker = openChecker;
  }

  /**
   * [**Documentation**](https://js2me.github.io/mobx-route/core/VirtualRoute.html#open-params-extraparams-query-replace-promise-void)
   */
  open(
    ...args: AllPropertiesOptional<TParams> extends true
      ? [params?: Maybe<TParams>, extraParams?: VirtualOpenExtraParams]
      : [params: TParams, extraParams?: VirtualOpenExtraParams]
  ): Promise<void>;
  async open(...args: any[]) {
    const params = (args[0] ?? {}) as unknown as TParams;
    const extraParams: Maybe<VirtualOpenExtraParams> = args[1];

    if (this.config.beforeOpen) {
      const beforeOpenResult = await this.config.beforeOpen(params, this);
      if (beforeOpenResult === false) {
        return;
      }
    }

    if (this.config.open == null) {
      this.isLocalOpened.set(true);
    } else {
      const result = await this.config.open(params, this);
      // because result can return void so this is truthy for opening state
      this.isLocalOpened.set(result !== false);
    }

    if (!this.isLocalOpened) {
      return;
    }

    if (extraParams?.query) {
      this.query.update(extraParams.query, extraParams.replace);
    }

    runInAction(() => {
      this.params = params;
    });
  }

  /**
   * [**Documentation**](https://js2me.github.io/mobx-route/core/VirtualRoute.html#close-void)
   */
  close() {
    if (this.config.close == null) {
      this.isLocalOpened.set(false);
    } else {
      const result = this.config.close(this);
      // because result can return void so this is truthy for opening state
      this.isLocalOpened.set(result !== false);
    }

    runInAction(() => {
      this.params = null;
    });
  }

  destroy() {
    this.abortController.abort();
  }
}

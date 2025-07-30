import { LinkedAbortController } from 'linked-abort-controller';
import {
  action,
  computed,
  makeObservable,
  observable,
  onBecomeObserved,
  onBecomeUnobserved,
  reaction,
  runInAction,
} from 'mobx';
import { IQueryParams } from 'mobx-location-history';
import { callFunction } from 'yummies/common';
import { IsPartial, AnyObject, EmptyObject, Maybe } from 'yummies/utils/types';

import { routeConfig } from '../config/index.js';

import {
  AbstractVirtualRoute,
  VirtualOpenExtraParams,
  VirtualRouteConfiguration,
} from './virtual-route.types.js';

/**
 * Class for creating routes with custom activation logic
 *
 * [**Documentation**](https://js2me.github.io/mobx-route/core/VirtualRoute.html)
 */
export class VirtualRoute<TParams extends AnyObject | EmptyObject = EmptyObject>
  implements AbstractVirtualRoute<TParams>
{
  protected abortController: AbortController;
  query: IQueryParams;
  params: TParams | null;

  private isLocalOpened: boolean;

  private openChecker: Maybe<VirtualRouteConfiguration<TParams>['checkOpened']>;
  private reactionDisposer: Maybe<VoidFunction>;

  constructor(protected config: VirtualRouteConfiguration<TParams> = {}) {
    this.abortController = new LinkedAbortController(config.abortSignal);
    this.query = config.queryParams ?? routeConfig.get().queryParams;
    this.params = callFunction(config.initialParams, this) ?? null;
    this.openChecker = config.checkOpened;
    this.isLocalOpened = this.openChecker?.(this) ?? false;

    observable(this, 'params');
    observable.ref(this, 'isLocalOpened');
    observable.ref(this, '_isOpened');
    computed.struct(this, 'isOpened');
    action(this, 'setOpenChecker');
    action(this, 'open');
    action(this, 'close');
    makeObservable(this);

    onBecomeObserved(this, 'isOpened', () => {
      if (!config.afterOpen && !config.afterClose) {
        return;
      }

      this.reactionDisposer = reaction(
        () => this.isOpened,
        this.processOpenedState,
        {
          signal: this.abortController.signal,
          fireImmediately: true,
        },
      );
    });
    onBecomeUnobserved(this, 'isOpened', () => {
      this.reactionDisposer?.();
      this.reactionDisposer = undefined;
    });
  }

  /**
   * [**Documentation**](https://js2me.github.io/mobx-route/core/VirtualRoute.html#isopened-boolean)
   */
  get isOpened() {
    const isOuterOpened = this.openChecker == null || this.openChecker(this);
    return this.isLocalOpened && isOuterOpened;
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
    ...args: IsPartial<TParams> extends true
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
      runInAction(() => {
        this.isLocalOpened = true;
      });
    } else {
      const result = await this.config.open(params, this);
      // because result can return void so this is truthy for opening state
      runInAction(() => {
        this.isLocalOpened = result !== false;
      });
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

    if (!this.reactionDisposer && this.isOpened) {
      this.config.afterOpen?.(this.params!, this);
    }
  }

  /**
   * [**Documentation**](https://js2me.github.io/mobx-route/core/VirtualRoute.html#close-void)
   */
  close() {
    if (this.config.close == null) {
      this.isLocalOpened = false;
    } else {
      const result = this.config.close(this);
      // because result can return void so this is truthy for opening state
      this.isLocalOpened = result !== false;
    }

    this.params = null;
  }

  private firstOpenedStateCheck = true;
  private processOpenedState = (isOpened: boolean) => {
    if (this.firstOpenedStateCheck) {
      this.firstOpenedStateCheck = false;
      // ignore first 'afterClose' callback call
      if (!isOpened) {
        return;
      }
    }

    if (isOpened) {
      this.config.afterOpen?.(this.params!, this);
    } else {
      this.config.afterClose?.();
    }
  };

  destroy() {
    this.abortController.abort();
  }
}

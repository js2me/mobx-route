import { LinkedAbortController } from 'linked-abort-controller';
import { action, computed, observable, reaction, runInAction } from 'mobx';
import type { IQueryParams } from 'mobx-location-history';
import { callFunction } from 'yummies/common';
import { applyObservable, type ObservableAnnotationsArray } from 'yummies/mobx';
import type { AnyObject, EmptyObject, IsPartial, Maybe } from 'yummies/types';
import { routeConfig } from '../config/index.js';
import type {
  AbstractVirtualRoute,
  VirtualOpenExtraParams,
  VirtualRouteConfiguration,
  VirtualRouteTrx,
} from './virtual-route.types.js';

const annotations: ObservableAnnotationsArray<VirtualRoute<any>> = [
  [observable, 'params'],
  [observable.ref, 'status', 'trx', 'openChecker', 'isOuterOpened'],
  [computed, 'isOpened', 'isOpening', 'isClosing'],
  [action, 'setOpenChecker', 'open', 'close'],
];

/**
 * Class for creating routes with custom activation logic
 *
 * [**Documentation**](https://js2me.github.io/mobx-route/core/VirtualRoute.html)
 */
export class VirtualRoute<TParams extends AnyObject | EmptyObject = EmptyObject>
  implements AbstractVirtualRoute<TParams>
{
  query: IQueryParams;
  params: TParams | null;

  protected abortController: AbortController;

  protected status:
    | 'opening'
    | 'open-rejected'
    | 'opened'
    | 'closing'
    | 'closed'
    | 'unknown';

  private openChecker: Maybe<VirtualRouteConfiguration<TParams>['checkOpened']>;

  private trx: Maybe<VirtualRouteTrx>;

  private skipAutoOpenClose: boolean;

  /**
   * [**Documentation**](https://js2me.github.io/mobx-route/core/VirtualRoute.html#isouteropened)
   */
  isOuterOpened: boolean | undefined;

  constructor(protected config: VirtualRouteConfiguration<TParams> = {}) {
    this.abortController = new LinkedAbortController(config.abortSignal);
    this.query = config.queryParams ?? routeConfig.get().queryParams;
    this.params = callFunction(config.initialParams, this) ?? null;
    this.openChecker = config.checkOpened;
    this.skipAutoOpenClose = false;
    this.isOuterOpened = this.openChecker?.(this);
    this.status = this.isOuterOpened ? 'opened' : 'unknown';

    applyObservable(this, annotations);

    this.abortController.signal.addEventListener(
      'abort',
      action(() => {
        this.status = 'unknown';
      }),
    );

    reaction(
      () => this.openChecker?.(this),
      action((isOuterOpened) => {
        this.isOuterOpened = isOuterOpened;

        if (
          this.skipAutoOpenClose ||
          this.status === 'closing' ||
          this.status === 'opening'
        ) {
          return;
        }

        if (this.isOuterOpened) {
          if (this.status === 'opened') {
            return;
          }
          // biome-ignore lint/nursery/noFloatingPromises: <explanation>
          this.confirmOpening({
            params: this.params ?? null,
            ...this.config.getAutomatedOpenParams?.(this),
          });
        } else {
          if (this.status === 'closed' || this.status === 'unknown') {
            return;
          }
          // biome-ignore lint/nursery/noFloatingPromises: <explanation>
          this.confirmClosing();
        }
      }),
      { signal: this.abortController.signal, fireImmediately: true },
    );

    if (this.status === 'opened') {
      this.config.afterOpen?.(this.params, this);
    }
  }

  /**
   * [**Documentation**](https://js2me.github.io/mobx-route/core/VirtualRoute.html#isopened)
   */
  get isOpened() {
    return this.status === 'opened' && this.isOuterOpened !== false;
  }

  /**
   * [**Documentation**](https://js2me.github.io/mobx-route/core/VirtualRoute.html#isopening)
   */
  get isOpening() {
    return this.status === 'opening';
  }

  /**
   * [**Documentation**](https://js2me.github.io/mobx-route/core/VirtualRoute.html#isclosing)
   */
  get isClosing() {
    return this.status === 'closing';
  }

  /**
   * [**Documentation**](https://js2me.github.io/mobx-route/core/VirtualRoute.html#setopenchecker)
   */
  setOpenChecker(
    openChecker: Maybe<VirtualRouteConfiguration<TParams>['checkOpened']>,
  ) {
    this.openChecker = openChecker;
  }

  /**
   * [**Documentation**](https://js2me.github.io/mobx-route/core/VirtualRoute.html#open)
   */
  open(
    ...args: IsPartial<TParams> extends true
      ? [params?: Maybe<TParams>, extraParams?: VirtualOpenExtraParams]
      : [params: TParams, extraParams?: VirtualOpenExtraParams]
  ): Promise<void>;
  async open(...args: any[]) {
    const params = (args[0] ?? null) as unknown as TParams;
    const extra: Maybe<VirtualOpenExtraParams> = args[1];

    this.skipAutoOpenClose = true;

    this.trx = {
      params,
      extra,
      manual: true,
    };

    await this.confirmOpening(this.trx);

    this.skipAutoOpenClose = false;
  }

  /**
   * [**Documentation**](https://js2me.github.io/mobx-route/core/VirtualRoute.html#close)
   */
  async close() {
    this.skipAutoOpenClose = true;
    const result = await this.confirmClosing();
    this.skipAutoOpenClose = false;
    return result;
  }

  private async confirmOpening(trx: VirtualRouteTrx) {
    runInAction(() => {
      this.trx = undefined;
      this.status = 'opening';
    });

    if ((await this.config.beforeOpen?.(trx.params, this)) === false) {
      runInAction(() => {
        this.status = 'open-rejected';
        this.trx = undefined;
      });
      return;
    }

    if ((await this.config.open?.(trx.params, this)) === false) {
      runInAction(() => {
        this.status = 'open-rejected';
        this.trx = undefined;
      });
      return;
    }

    runInAction(() => {
      if (trx.extra?.query) {
        this.query.update(trx.extra.query, trx.extra.replace);
      }

      this.trx = undefined;
      this.params = trx.params;
      this.status = 'opened';
      this.config.afterOpen?.(this.params!, this);
    });

    return true;
  }

  private async confirmClosing() {
    if (this.status === 'closed') {
      return true;
    }

    const lastStatus = this.status;

    runInAction(() => {
      this.status = 'closing';
    });

    if ((await this.config.beforeClose?.()) === false) {
      runInAction(() => {
        this.status = lastStatus;
      });
      return;
    }

    if (this.config.close?.(this) === false) {
      runInAction(() => {
        this.status = lastStatus;
      });
      return;
    }

    runInAction(() => {
      this.status = 'closed';
      this.params = null;
    });

    return true;
  }

  destroy() {
    this.abortController.abort();
  }
}

export const createVirtualRoute = <
  TParams extends AnyObject | EmptyObject = EmptyObject,
>(
  config?: VirtualRouteConfiguration<TParams>,
) => new VirtualRoute<TParams>(config);

import { LinkedAbortController } from 'linked-abort-controller';
import {
  action,
  comparer,
  computed,
  makeObservable,
  observable,
  reaction,
  runInAction,
  untracked,
} from 'mobx';
import type { IQueryParams } from 'mobx-location-history';
import { callFunction } from 'yummies/common';
import type { AnyObject, EmptyObject, IsPartial, Maybe } from 'yummies/types';
import { routeConfig } from '../config/index.js';
import type {
  AbstractVirtualRoute,
  VirtualOpenExtraParams,
  VirtualRouteConfiguration,
  VirtualRouteTrx,
} from './virtual-route.types.js';

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

  private skipAutoOpenProcess: boolean;

  constructor(protected config: VirtualRouteConfiguration<TParams> = {}) {
    this.abortController = new LinkedAbortController(config.abortSignal);
    this.query = config.queryParams ?? routeConfig.get().queryParams;
    this.params =
      callFunction(config.initialParams, this) ??
      callFunction(config.getParams, this) ??
      null;
    this.openChecker = config.checkOpened;
    this.skipAutoOpenProcess = false;
    this.status = 'unknown';

    observable(this, 'params');
    observable.ref(this, 'isLocalOpened');
    observable.ref(this, 'status');
    observable.ref(this, 'trx');
    computed(this, 'isOpened');
    computed(this, 'isOpening');
    computed(this, 'isClosing');
    action(this, 'setOpenChecker');
    action(this, 'open');
    action(this, 'close');
    makeObservable(this);

    this.abortController.signal.addEventListener(
      'abort',
      action(() => {
        this.status = 'unknown';
      }),
    );

    if (config.getParams) {
      reaction(
        () => config.getParams!(this),
        action((params) => {
          this.params = params ?? null;
        }),
        {
          equals: comparer.structural,
          signal: this.abortController.signal,
        },
      );
    }

    reaction(
      (): Maybe<VirtualRouteTrx> => {
        if (!this.skipAutoOpenProcess && this.openChecker?.(this)) {
          return untracked(() => ({
            extra: {
              query: this.query.data,
            },
            params: this.params ?? null,
          }));
        }
      },
      (trx) => {
        if (trx) {
          // biome-ignore lint/nursery/noFloatingPromises: <explanation>
          this.confirmOpening(trx);
        }
      },
      {
        fireImmediately: true,
        signal: this.abortController.signal,
        equals: comparer.structural,
      },
    );
  }

  /**
   * [**Documentation**](https://js2me.github.io/mobx-route/core/VirtualRoute.html#isopened-boolean)
   */
  get isOpened() {
    return this.status === 'opened';
  }

  /**
   * [**Documentation**](https://js2me.github.io/mobx-route/core/VirtualRoute.html#isopening-boolean)
   */
  get isOpening() {
    return this.status === 'opening';
  }

  /**
   * [**Documentation**](https://js2me.github.io/mobx-route/core/VirtualRoute.html#isclosing-boolean)
   */
  get isClosing() {
    return this.status === 'closing';
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
    const params = (args[0] ?? null) as unknown as TParams;
    const extra: Maybe<VirtualOpenExtraParams> = args[1];

    this.skipAutoOpenProcess = true;

    this.trx = {
      params,
      extra,
      manual: true,
    };

    await this.confirmOpening(this.trx);

    this.skipAutoOpenProcess = false;
  }

  /**
   * [**Documentation**](https://js2me.github.io/mobx-route/core/VirtualRoute.html#close-void)
   */
  async close() {
    await this.confirmClosing();
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

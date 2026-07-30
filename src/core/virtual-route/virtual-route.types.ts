import type { IQueryParams } from 'mobx-location-history';
import type {
  AnyObject,
  EmptyObject,
  IsPartial,
  Maybe,
  MaybeFn,
  MaybePromise,
} from 'yummies/types';
import type { RouteNavigateParams } from '../route/index.js';
import type { VirtualRoute } from './virtual-route.js';

export type AnyVirtualRoute =
  | VirtualRoute<any, any>
  | AbstractVirtualRoute<any, any>;

export interface VirtualOpenExtraParams<
  TQueryParams extends Record<string, any> = AnyObject,
> extends Omit<RouteNavigateParams<TQueryParams>, 'state' | 'mergeQuery'> {}

export interface AbstractVirtualRoute<
  TParams extends AnyObject | EmptyObject = EmptyObject,
  TQueryParams extends Record<string, any> = AnyObject,
> {
  isOpened: boolean;
  isOpening: boolean;
  params: TParams | null;

  /**
   * [**Documentation**](https://js2me.github.io/mobx-route/core/VirtualRoute.html#open)
   */
  open(
    ...args: IsPartial<TParams> extends true
      ? [
          params?: Maybe<TParams>,
          extraParams?: VirtualOpenExtraParams<TQueryParams>,
        ]
      : [params: TParams, extraParams?: VirtualOpenExtraParams<TQueryParams>]
  ): Promise<void>;
}

export interface VirtualRouteConfiguration<
  TParams extends AnyObject | EmptyObject = EmptyObject,
> {
  /**
   * [**Documentation**](https://js2me.github.io/mobx-route/core/VirtualRoute.html#abortsignal)
   */
  abortSignal?: AbortSignal;

  queryParams?: IQueryParams;

  /**
   * [**Documentation**](https://js2me.github.io/mobx-route/core/VirtualRoute.html#initialparams)
   */
  initialParams?: MaybeFn<
    Maybe<TParams>,
    [route: VirtualRoute<NoInfer<TParams>>]
  >;

  /**
   * [**Documentation**](https://js2me.github.io/mobx-route/core/VirtualRoute.html#getautoopenparams)
   */
  getAutoOpenParams?: (
    route: VirtualRoute<NoInfer<TParams>>,
  ) => Maybe<Omit<VirtualRouteTrx, 'manual'>>;

  /**
   * [**Documentation**](https://js2me.github.io/mobx-route/core/VirtualRoute.html#meta)
   */
  meta?: AnyObject;

  /**
   * Custom implementation of open behaviour for this route
   *
   * [**Documentation**](https://js2me.github.io/mobx-route/core/VirtualRoute.html#open)
   */
  open?: (
    ...args: IsPartial<TParams> extends true
      ? [params: Maybe<TParams>, route: VirtualRoute<TParams>]
      : [params: TParams, route: VirtualRoute<TParams>]
  ) => MaybePromise<boolean | void>;

  /**
   * Custom implementation of close behaviour for this route
   *
   * [**Documentation**](https://js2me.github.io/mobx-route/core/VirtualRoute.html#close)
   */
  close?: (route: VirtualRoute<TParams>) => boolean | void;

  /**
   * [**Documentation**](https://js2me.github.io/mobx-route/core/VirtualRoute.html#checkopened)
   */
  checkOpened?: (route: VirtualRoute<TParams>) => boolean;

  /**
   * [**Documentation**](https://js2me.github.io/mobx-route/core/VirtualRoute.html#beforeopen)
   */
  beforeOpen?: (
    ...args: IsPartial<TParams> extends true
      ? [params: Maybe<TParams>, route: VirtualRoute<TParams>]
      : [params: TParams, route: VirtualRoute<TParams>]
  ) => MaybePromise<void | boolean>;

  /**
   * [**Documentation**](https://js2me.github.io/mobx-route/core/VirtualRoute.html#afterclose)
   */
  afterClose?: () => void;

  /**
   * [**Documentation**](https://js2me.github.io/mobx-route/core/VirtualRoute.html#beforeclose)
   */
  beforeClose?: () => MaybePromise<void | boolean>;

  /**
   * [**Documentation**](https://js2me.github.io/mobx-route/core/VirtualRoute.html#afteropen)
   */
  afterOpen?: (
    params: NoInfer<TParams | null>,
    route: VirtualRoute<NoInfer<TParams>>,
  ) => void;
  /**
   * [**Documentation**](https://js2me.github.io/mobx-route/core/VirtualRoute.html#afterupdate)
   */
  afterUpdate?: (
    params: NoInfer<TParams | null>,
    route: VirtualRoute<NoInfer<TParams>>,
  ) => void;
}

export interface VirtualRouteTrx<
  TQueryParams extends Record<string, any> = AnyObject,
> {
  params: any;
  extra?: Maybe<VirtualOpenExtraParams<TQueryParams>>;
  manual?: boolean;
}

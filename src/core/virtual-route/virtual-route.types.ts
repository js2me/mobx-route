import { IQueryParams } from 'mobx-location-history';
import {
  AllPropertiesOptional,
  AnyObject,
  EmptyObject,
  Maybe,
  MaybeFn,
  MaybePromise,
} from 'yummies/utils/types';

import type { VirtualRoute } from './virtual-route.js';

export type AnyVirtualRoute = VirtualRoute<any>;

export interface VirtualOpenExtraParams {
  query?: AnyObject;
  replace?: boolean;
}

export interface VirtualRouteConfiguration<
  TParams extends AnyObject | EmptyObject = EmptyObject,
> {
  abortSignal?: AbortSignal;
  queryParams?: IQueryParams;
  initialParams?: MaybeFn<Maybe<TParams>, [route: VirtualRoute<TParams>]>;

  // custom implementation of open behaviour for this route
  // if not provided, default implementation will be used
  open?: (
    ...args: AllPropertiesOptional<TParams> extends true
      ? [params: Maybe<TParams>, route: VirtualRoute<TParams>]
      : [params: TParams, route: VirtualRoute<TParams>]
  ) => MaybePromise<boolean | void>;
  // custom implementation of close behaviour for this route
  // if not provided, default implementation will be used
  close?: (route: VirtualRoute<TParams>) => boolean | void;

  checkOpened?: (route: VirtualRoute<TParams>) => boolean;
  beforeOpen?: (
    ...args: AllPropertiesOptional<TParams> extends true
      ? [params: Maybe<TParams>, route: VirtualRoute<TParams>]
      : [params: TParams, route: VirtualRoute<TParams>]
  ) => MaybePromise<void | boolean>;
  afterClose?: () => void;
  afterOpen?: (
    params: NoInfer<TParams>,
    route: VirtualRoute<NoInfer<TParams>>,
  ) => void;
}

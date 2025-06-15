import { IQueryParams } from 'mobx-location-history';
import { FnValue } from 'yummies/common';
import {
  AllPropertiesOptional,
  AnyObject,
  EmptyObject,
  Maybe,
} from 'yummies/utils/types';

import type { VirtualRoute } from './virtual-route.js';

export type AnyVirtualRoute = VirtualRoute<any>;

export interface VirtualRouteConfiguration<
  TParams extends AnyObject | EmptyObject = EmptyObject,
> {
  abortSignal?: AbortSignal;
  queryParams?: IQueryParams;
  checkOpened?: FnValue<boolean, [route: VirtualRoute<TParams>]>;
  initialParams?: FnValue<Maybe<TParams>, [route: VirtualRoute<TParams>]>;

  // custom implementation of open behaviour for this route
  // if not provided, default implementation will be used
  open?: (
    ...args: AllPropertiesOptional<TParams> extends true
      ? [params: Maybe<TParams>, route: VirtualRoute<TParams>]
      : [params: TParams, route: VirtualRoute<TParams>]
  ) => boolean;
  // custom implementation of close behaviour for this route
  // if not provided, default implementation will be used
  close?: (route: VirtualRoute<TParams>) => boolean;
  onOpen?: (params: TParams, route: VirtualRoute<TParams>) => void;
  afterClose?: () => void;
  stringContent?: string;
}

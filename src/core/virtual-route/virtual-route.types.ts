import { IQueryParams } from 'mobx-location-history';
import { FnValue } from 'yummies/common';
import {
  AllPropertiesOptional,
  AnyObject,
  EmptyObject,
  Maybe,
} from 'yummies/utils/types';

import type { VirtualRoute } from './virtual-route.js';

export type AnyVirtualRoute = VirtualRoute<AnyObject>

export interface VirtualRouteConfiguration<
  TParams extends AnyObject | EmptyObject = EmptyObject,
> {
  queryParams?: IQueryParams;
  checkOpened?: FnValue<boolean, [route: VirtualRoute<TParams>]>;
  initialParams?: Maybe<TParams>;

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
}

import { IQueryParams } from 'mobx-location-history';
import { FnValue } from 'yummies/common';
import {
  AllPropertiesOptional,
  AnyObject,
  EmptyObject,
  Maybe,
} from 'yummies/utils/types';

export interface VirtualRouteConfiguration<
  TParams extends AnyObject | EmptyObject = EmptyObject,
> {
  queryParams?: IQueryParams;
  checkOpened?: FnValue<boolean, [query: IQueryParams['data']]>;

  // custom implementation of open behaviour for this route
  // if not provided, default implementation will be used
  open?: (
    ...args: AllPropertiesOptional<TParams> extends true
      ? [params?: Maybe<TParams>, query?: AnyObject]
      : [params: TParams, query?: AnyObject]
  ) => boolean;
  // custom implementation of close behaviour for this route
  // if not provided, default implementation will be used
  close?: (query: AnyObject) => boolean;
}

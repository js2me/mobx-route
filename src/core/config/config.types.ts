import type { History, IQueryParams } from 'mobx-location-history';
import type { Maybe } from 'yummies/utils/types';
import type { UrlCreateParams } from '../route/route.types.js';

export interface RouteGlobalConfig {
  history: History;
  queryParams: IQueryParams;
  baseUrl?: string;
  mergeQuery?: boolean;
  createUrl?: (params: UrlCreateParams<any>) => Maybe<UrlCreateParams<any>>;
}

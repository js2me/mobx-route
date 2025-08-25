import type { History, IQueryParams } from 'mobx-location-history';
import type { UrlCreateParamsFn } from '../route/route.types.js';

export interface RouteGlobalConfig {
  history: History;
  queryParams: IQueryParams;
  baseUrl?: string;
  mergeQuery?: boolean;
  createUrl?: UrlCreateParamsFn;
  formatLinkHref?: (href: string) => string;
}

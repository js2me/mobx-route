import type { History, IQueryParams } from 'mobx-location-history';
import type { UrlCreateParamsFn } from '../route/index.js';

export interface RouteGlobalConfig {
  history: History;
  queryParams: IQueryParams;
  baseUrl?: string;
  mergeQuery?: boolean;
  createUrl?: UrlCreateParamsFn;
  formatLinkHref?: (href: string) => string;
}

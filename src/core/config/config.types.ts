import type { History, IQueryParams } from 'mobx-location-history';
import type { UrlCreateParamsFn } from '../route/index.js';

/**
 * Global configuration for routes and router.
 * @see [**Documentation**](https://js2me.github.io/mobx-route/core/routeConfig.html)
 */
export interface RouteGlobalConfig {
  /** @see [**Documentation**](https://js2me.github.io/mobx-route/core/routeConfig.html#history) */
  history: History;
  /** @see [**Documentation**](https://js2me.github.io/mobx-route/core/routeConfig.html#queryparams) */
  queryParams: IQueryParams;
  /** @see [**Documentation**](https://js2me.github.io/mobx-route/core/routeConfig.html#baseurl) */
  baseUrl?: string;
  /** @see [**Documentation**](https://js2me.github.io/mobx-route/core/routeConfig.html#mergequery) */
  mergeQuery?: boolean;
  /** @see [**Documentation**](https://js2me.github.io/mobx-route/core/routeConfig.html#createurl) */
  createUrl?: UrlCreateParamsFn;
  /** @see [**Documentation**](https://js2me.github.io/mobx-route/core/routeConfig.html#formatlinkhref) */
  formatLinkHref?: (href: string) => string;
  /** @see [**Documentation**](https://js2me.github.io/mobx-route/core/routeConfig.html#fallbackpath) */
  fallbackPath?: string;
}

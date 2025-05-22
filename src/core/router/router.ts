import {
  AnyHistory,
  AnyLocation,
  buildSearchString,
  IQueryParams,
} from 'mobx-location-history';

import { routeConfig } from '../config/config.js';
import { RoutesCollection } from '../route-group/index.js';

import { RouterConfiguration, RouterNavigateOptions } from './router.types.js';

/**
 * Class for centralized routing management.
 *
 * [**Documentation**](https://js2me.github.io/mobx-route/core/Router.html)
 */
export class Router<TRoutesCollection extends RoutesCollection> {
  routes: TRoutesCollection;
  history: AnyHistory;
  location: AnyLocation;
  query: IQueryParams;

  constructor(config: RouterConfiguration<TRoutesCollection>) {
    this.routes = config.routes;
    this.history = config.history ?? routeConfig.get().history;
    this.location = config.location ?? routeConfig.get().location ?? this.history.location;
    this.query = config.queryParams ?? routeConfig.get().queryParams;
  }

  navigate(url: string, options?: RouterNavigateOptions) {
    const navigationUrl = [url, buildSearchString(options?.query || {})].join(
      '',
    );

    if (options?.replace) {
      this.history.replace(navigationUrl, options?.state);
    } else {
      this.history.push(navigationUrl, options?.state);
    }
  }
}

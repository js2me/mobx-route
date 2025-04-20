import {
  buildSearchString,
  IMobxHistory,
  IMobxLocation,
  IQueryParams,
} from 'mobx-location-history';

import { routeConfig } from './config.js';
import { RoutesCollection } from './route-group.types.js';
import { RouterConfiguration, RouterNavigateOptions } from './router.types.js';

export class Router<TRoutesCollection extends RoutesCollection> {
  routes: TRoutesCollection;
  history: IMobxHistory;
  location: IMobxLocation;
  query: IQueryParams;

  constructor(config: RouterConfiguration<TRoutesCollection>) {
    this.routes = config.routes;
    this.history = config.history ?? routeConfig.get().history;
    this.location = config.location ?? routeConfig.get().location;
    this.query = config.queryParams ?? routeConfig.get().queryParams;
  }

  navigate(url: string, options?: RouterNavigateOptions) {
    const navigationUrl = [url, buildSearchString(options?.query || {})].join(
      '',
    );

    if (options?.replace) {
      this.history.replaceState(null, '', navigationUrl);
    } else {
      this.history.pushState(null, '', navigationUrl);
    }
  }
}

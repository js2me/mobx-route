import { computed, makeObservable } from 'mobx';
import {
  buildSearchString,
  type History,
  type IQueryParams,
} from 'mobx-location-history';

import { routeConfig } from '../config/config.js';
import type { RoutesCollection } from '../route-group/index.js';

import type {
  RouterConfiguration,
  RouterNavigateOptions,
} from './router.types.js';

/**
 * Class for centralized routing management.
 *
 * [**Documentation**](https://js2me.github.io/mobx-route/core/Router.html)
 */
export class Router<TRoutesCollection extends RoutesCollection> {
  routes: TRoutesCollection;
  history: History;
  query: IQueryParams;

  constructor(config: RouterConfiguration<TRoutesCollection>) {
    this.routes = config.routes;
    this.history = config.history ?? routeConfig.get().history;
    this.query = config.queryParams ?? routeConfig.get().queryParams;

    computed.struct(this, 'location');

    makeObservable(this);
  }

  get location() {
    return this.history.location;
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

export const createRouter = <TRoutesCollection extends RoutesCollection>(
  config: RouterConfiguration<TRoutesCollection>,
) => new Router(config);

import {
  createBrowserHistory,
  type History,
  type IQueryParams,
  isObservableHistory,
  QueryParams,
} from 'mobx-location-history';
import { createGlobalDynamicConfig } from 'yummies/complex';

import type { RouteGlobalConfig } from './config.types.js';

let localHistory: History | undefined;

export const routeConfig = createGlobalDynamicConfig<RouteGlobalConfig>(
  (update) => {
    if (localHistory && update?.history && isObservableHistory(localHistory)) {
      localHistory.destroy();
    }

    let history: History;

    if (update?.history) {
      history = update.history;
    } else {
      history = localHistory = createBrowserHistory();
    }

    let queryParams: IQueryParams;

    if (update?.history && !update.queryParams) {
      queryParams = new QueryParams({ history });
    } else {
      if (update?.queryParams) {
        queryParams = update.queryParams;
      } else {
        queryParams = new QueryParams({ history });
      }
    }

    return {
      ...update,
      history,
      location,
      queryParams,
    };
  },
  Symbol.for('MOBX_ROUTE_CONFIG'),
);

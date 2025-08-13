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
let localQueryParams: IQueryParams | undefined;

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
      if (localQueryParams) {
        localQueryParams.destroy();
      }
      queryParams = localQueryParams = new QueryParams({ history });
    } else {
      if (localQueryParams && update?.queryParams) {
        localQueryParams.destroy();
      }
      if (update?.queryParams) {
        queryParams = update.queryParams;
      } else {
        queryParams = localQueryParams = new QueryParams({ history });
      }
    }

    return {
      ...update,
      history,
      location,
      queryParams,
    };
  },
);

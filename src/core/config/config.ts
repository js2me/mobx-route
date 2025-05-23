import {
  IQueryParams,
  QueryParams,
  History,
  isObservableHistory,
  createBrowserHistory,
} from 'mobx-location-history';
import { createGlobalDynamicConfig } from 'yummies/complex';

import { RouteGlobalConfig } from './config.types.js';

let localHistory: History | undefined;
let localQueryParams: IQueryParams | undefined;

export const routeConfig = createGlobalDynamicConfig<RouteGlobalConfig>(
  (update) => {
    if (localHistory && update?.history && isObservableHistory(localHistory)) {
      localHistory.destroy();
    }

    const history = update?.history ?? (localHistory = createBrowserHistory());

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
      queryParams =
        update?.queryParams ??
        (localQueryParams = new QueryParams({ history }));
    }

    return {
      ...update,
      history,
      location,
      queryParams,
    };
  },
);

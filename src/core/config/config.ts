import {
  createBrowserHistory,
  createQueryParams,
  type History,
  type IQueryParams,
  isObservableHistory,
} from 'mobx-location-history';
import { createGlobalDynamicConfig } from 'yummies/complex';

import type { RouteGlobalConfig } from './config.types.js';

export const routeConfig = createGlobalDynamicConfig<RouteGlobalConfig>(
  (update, current) => {
    let history: History;
    let queryParams: IQueryParams | undefined;

    if (update?.history) {
      history = update.history;
      queryParams = update.queryParams;

      if (current?.history && isObservableHistory(current.history)) {
        current.history.destroy();
      }
    } else if (current?.history) {
      history = current.history;
      queryParams = update?.queryParams ?? current.queryParams;
    } else {
      history = createBrowserHistory();
    }

    queryParams ??= createQueryParams({ history });

    return {
      ...update,
      history,
      queryParams,
    };
  },
  Symbol.for('MOBX_ROUTE_CONFIG'),
);

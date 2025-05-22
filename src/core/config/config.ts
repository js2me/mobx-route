import {
  IQueryParams,
  History,
  QueryParams,
  AnyLocation,
  AnyHistory,
} from 'mobx-location-history';
import { createGlobalDynamicConfig } from 'yummies/complex';

import { RouteGlobalConfig } from './config.types.js';

let localHistory: AnyHistory | undefined;
let localLocation: AnyLocation | undefined;
let localQueryParams: IQueryParams | undefined;

export const routeConfig = createGlobalDynamicConfig<RouteGlobalConfig>(
  (update) => {
    if (localHistory && update?.history) {
      localHistory.destroy();
    }

    const history = update?.history ?? (localHistory = new History());

    if (localLocation && update?.location && 'destroy' in localLocation) {
      localLocation.destroy();
    }

    const location = update?.location ?? history.location;
    let queryParams: IQueryParams;

    if ((update?.history || update?.location) && !update.queryParams) {
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

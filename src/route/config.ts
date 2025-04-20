import {
  IQueryParams,
  MobxHistory,
  MobxLocation,
  QueryParams,
} from 'mobx-location-history';
import { createGlobalDynamicConfig } from 'yummies/complex';

import { RouteGlobalConfiguration } from './route.types.js';

let localHistory: MobxHistory | undefined;
let localLocation: MobxLocation | undefined;
let localQueryParams: IQueryParams | undefined;

export const routeConfig = createGlobalDynamicConfig<RouteGlobalConfiguration>(
  (update) => {
    if (update?.router) {
      localHistory?.destroy();
      localLocation?.destroy();
      localQueryParams?.destroy();

      return {
        ...update,
        history: update.router.history,
        location: update.router.location,
        queryParams: update.router.query,
      };
    }

    if (localHistory && update?.history) {
      localHistory.destroy();
    }

    const history = update?.history ?? (localHistory = new MobxHistory());

    if (localLocation && update?.location) {
      localLocation.destroy();
    }

    const location =
      update?.location ?? (localLocation = new MobxLocation(history));
    let queryParams: IQueryParams;

    if ((update?.history || update?.location) && !update.queryParams) {
      queryParams = localQueryParams = new QueryParams(location, history);
    } else {
      if (localQueryParams && update?.queryParams) {
        localQueryParams.destroy();
      }
      queryParams =
        update?.queryParams ??
        (localQueryParams = new QueryParams(location, history));
    }

    return {
      ...update,
      history,
      location,
      queryParams,
    };
  },
);

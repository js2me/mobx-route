import { IQueryParams, MobxHistory, MobxLocation, QueryParams } from 'mobx-location-history';
import { createGlobalDynamicConfig } from 'yummies/complex';

import { RouteGlobalConfiguration } from './route.types.js';

export const routeConfig = createGlobalDynamicConfig<RouteGlobalConfiguration>(
  (update, current) => {
    const history = update?.history ?? current?.history ?? new MobxHistory();
    const location = update?.location ?? current?.location ?? new MobxLocation(history);
    let queryParams: IQueryParams

    if ((update?.history || update?.location) && !update.queryParams) {
      queryParams = new QueryParams(location, history);
    } else {
      queryParams = update?.queryParams ?? current?.queryParams ?? new QueryParams(location, history);
    }

    return {
      ...update,
      history,
      location,
      queryParams,
    };
  },
);

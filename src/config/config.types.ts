import {
  IMobxHistory,
  IMobxLocation,
  IQueryParams,
} from 'mobx-location-history';

import type { AnyRouter } from '../router/index.js';

export interface RouteGlobalConfig {
  history: IMobxHistory;
  location: IMobxLocation;
  queryParams: IQueryParams;
  router?: AnyRouter;
  baseUrl?: string;
}

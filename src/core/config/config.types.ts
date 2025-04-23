import {
  IMobxHistory,
  IMobxLocation,
  IQueryParams,
} from 'mobx-location-history';

export interface RouteGlobalConfig {
  history: IMobxHistory;
  location: IMobxLocation;
  queryParams: IQueryParams;
  baseUrl?: string;
}

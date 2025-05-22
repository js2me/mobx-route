import { AnyHistory, AnyLocation, IQueryParams } from 'mobx-location-history';

export interface RouteGlobalConfig {
  history: AnyHistory;
  location?: AnyLocation;
  queryParams: IQueryParams;
  baseUrl?: string;
  useHashRouting?: boolean;
}

import { History, IQueryParams } from 'mobx-location-history';

export interface RouteGlobalConfig {
  history: History;
  queryParams: IQueryParams;
  baseUrl?: string;
}

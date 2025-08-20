import type { History, IQueryParams } from 'mobx-location-history';
import type { RouteNavigateParams } from '../route/route.types.js';
import type { RoutesCollection } from '../route-group/index.js';
import type { Router } from './router.js';

export interface RouterConfiguration<TRoutesStruct extends RoutesCollection> {
  routes: TRoutesStruct;
  history?: History;
  queryParams?: IQueryParams;
}

export interface RouterNavigateOptions extends RouteNavigateParams {}

export type AnyRouter = Router<RoutesCollection>;

import type { History, IQueryParams } from 'mobx-location-history';
import type { AnyObject } from 'yummies/utils/types';

import type { RoutesCollection } from '../route-group/index.js';

import type { Router } from './router.js';

export interface RouterConfiguration<TRoutesStruct extends RoutesCollection> {
  routes: TRoutesStruct;
  history?: History;
  queryParams?: IQueryParams;
}

export interface RouterNavigateOptions {
  replace?: boolean;
  state?: any;
  query?: AnyObject;
}

export type AnyRouter = Router<RoutesCollection>;

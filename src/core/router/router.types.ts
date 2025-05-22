import { AnyHistory, AnyLocation, IQueryParams } from 'mobx-location-history';
import { AnyObject } from 'yummies/utils/types';

import { RoutesCollection } from '../route-group/index.js';

import { Router } from './router.js';

export interface RouterConfiguration<TRoutesStruct extends RoutesCollection> {
  routes: TRoutesStruct;
  history?: AnyHistory;
  location?: AnyLocation;
  queryParams?: IQueryParams;
}

export interface RouterNavigateOptions {
  replace?: boolean;
  state?: any;
  query?: AnyObject;
}

export type AnyRouter = Router<RoutesCollection>;

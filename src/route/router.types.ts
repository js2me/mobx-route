import {
  IMobxHistory,
  IMobxLocation,
  IQueryParams,
} from 'mobx-location-history';
import { AnyObject } from 'yummies/utils/types';

import type { RoutesCollection } from './route-group.types.js';
import { Router } from './router.js';

export interface RouterConfiguration<TRoutesStruct extends RoutesCollection> {
  routes: TRoutesStruct;
  history?: IMobxHistory;
  location?: IMobxLocation;
  queryParams?: IQueryParams;
}

export interface RouterNavigateOptions {
  replace?: boolean;
  query?: AnyObject;
}

export type AnyRouter = Router<RoutesCollection>;

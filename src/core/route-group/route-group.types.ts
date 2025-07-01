import type { AbstractPathRoute, AnyRoute } from '../route/index.js';
import {
  AbstractVirtualRoute,
  AnyVirtualRoute,
} from '../virtual-route/index.js';

import type { RouteGroup } from './route-group.js';

export type AnyRouteGroup = RouteGroup<RoutesCollection>;

export type AnyRouteEntity = AnyRoute | AnyRouteGroup | AnyVirtualRoute;

export interface AbstractRouteGroup<
  TRoutesCollection extends RoutesCollection = RoutesCollection,
> {
  routes: TRoutesCollection;
  isOpened: boolean;
}

export type AnyAbstractRoute = AbstractPathRoute | AbstractVirtualRoute<any>;

export type AnyAbstractRouteEntity = AnyAbstractRoute | AbstractRouteGroup;

export type RoutesArrayCollection = AnyAbstractRouteEntity[];

export type RoutesObjectCollection = Record<string, AnyAbstractRouteEntity>;

export type RoutesCollection = RoutesArrayCollection | RoutesObjectCollection;

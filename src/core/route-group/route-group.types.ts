import { EmptyObject, ValueOf } from 'yummies/utils/types';

import type { AnyRoute } from '../route/index.js';
import { AnyVirtualRoute } from '../virtual-route/index.js';

import type { RouteGroup } from './route-group.js';

export type AnyRouteGroup = RouteGroup<RoutesCollection>;

export type AnyRouteEntity = AnyRoute | AnyRouteGroup | AnyVirtualRoute;

export type RoutesArrayCollection = AnyRouteEntity[];

export type RoutesObjectCollection = Record<string, AnyRouteEntity>;

export type RoutesCollection = RoutesArrayCollection | RoutesObjectCollection;

export type AnyRouteFromCollection<TRoutes extends RoutesCollection> = ValueOf<
  TRoutes extends RoutesArrayCollection
    ? {
        [K in keyof TRoutes]: TRoutes[K] extends AnyRouteEntity
          ? TRoutes[K]
          : never;
      }
    : TRoutes extends RoutesObjectCollection
      ? {
          [K in keyof TRoutes]: TRoutes[K] extends AnyRouteEntity
            ? TRoutes[K]
            : never;
        }
      : EmptyObject
>;

import type { RouteGroup } from './route-group.js';
import { AnyRoute } from './route.types.js';
import { VirtualRoute } from './virtual-route.js';

export type AnyRouteGroup = RouteGroup<RoutesCollection>;

export type RouteCollectionItem = AnyRoute | AnyRouteGroup | VirtualRoute;

export type RoutesCollection = Record<string, RouteCollectionItem>;

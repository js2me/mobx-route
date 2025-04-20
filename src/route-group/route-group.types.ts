import type { AnyRoute } from '../route/index.js';
import { VirtualRoute } from '../virtual-route/index.js';

import type { RouteGroup } from './route-group.js';

export type AnyRouteGroup = RouteGroup<RoutesCollection>;

export type RouteCollectionItem = AnyRoute | AnyRouteGroup | VirtualRoute;

export type RoutesCollection = Record<string, RouteCollectionItem>;

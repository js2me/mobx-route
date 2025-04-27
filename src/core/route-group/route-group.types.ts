import type { AnyRoute } from '../route/index.js';
import { AnyVirtualRoute } from '../virtual-route/index.js';

import type { RouteGroup } from './route-group.js';

export type AnyRouteGroup = RouteGroup<RoutesCollection>;

export type AnyRouteEntity = AnyRoute | AnyRouteGroup | AnyVirtualRoute;

export type RoutesCollection = Record<string, AnyRouteEntity>;

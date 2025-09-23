import type { AnyRouteEntity } from '../route-group/index.js';

export const isRouteEntity = (route: any): route is AnyRouteEntity =>
  route && 'isOpened' in route;

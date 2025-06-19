import { AnyRouteEntity } from '../route-group/route-group.types.js';

export const isRouteEntity = (route: any): route is AnyRouteEntity =>
  route && 'isOpened' in route;

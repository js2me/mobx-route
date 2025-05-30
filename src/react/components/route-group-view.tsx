import { memo, ReactNode } from 'react';
import { EmptyObject } from 'yummies/utils/types';

import {
  AnyRouteEntity,
  AnyRouteGroup,
  RoutesArrayCollection,
  RoutesCollection,
  RoutesObjectCollection,
} from '../../core/index.js';

import {
  RouteView,
  RouteViewComponent,
  RouteViewConfigProps,
} from './route-view.js';

export type RouteGroupView<TRouteEntity extends AnyRouteEntity> =
  // route view detailed configuration
  | Omit<RouteViewConfigProps<TRouteEntity>, 'route'>
  // only route view component
  | RouteViewComponent<TRouteEntity>;

export type RouteGroupViews<TRoutes extends RoutesCollection> =
  TRoutes extends RoutesArrayCollection
    ? {
        [K in keyof TRoutes]: TRoutes[K] extends AnyRouteEntity
          ? RouteGroupView<TRoutes[K]>
          : never;
      }
    : TRoutes extends RoutesObjectCollection
      ? {
          [K in keyof TRoutes]: TRoutes[K] extends AnyRouteEntity
            ? RouteGroupView<TRoutes[K]>
            : never;
        }
      : EmptyObject;

export interface RouteGroupViewProps<TRouteGroup extends AnyRouteGroup> {
  group: TRouteGroup;
  views: Partial<RouteGroupViews<TRouteGroup['routes']>>;
  notOpenedContent?: ReactNode;
}

const RouteGroupViewBase = <TRouteGroup extends AnyRouteGroup>({
  group,
  views,
  notOpenedContent,
}: RouteGroupViewProps<TRouteGroup>) => {
  const viewEntries = Object.entries(views);

  const openedRouteEntry = viewEntries.find(([routeName]) => {
    // @ts-expect-error Object.entries is not accept types for arrays
    const route = group.routes[routeName];
    return route.isOpened;
  });
  const openedRouteName = openedRouteEntry?.[0];
  const openedRoutePropsOrView = openedRouteEntry?.[1];

  const openedRoute: AnyRouteEntity | undefined =
    openedRouteName && openedRouteName in group.routes
      ? // @ts-expect-error Object.entries is not accept types for arrays
        group.routes[openedRouteName]
      : undefined;

  if (!openedRoute) {
    return notOpenedContent ?? null;
  }

  const openedRouteViewProps =
    openedRoutePropsOrView &&
    (typeof openedRoutePropsOrView === 'function' ||
      'contextTypes' in openedRoutePropsOrView ||
      '$$typeof' in openedRoutePropsOrView)
      ? {
          view: openedRoutePropsOrView as any,
          notOpenedContent,
        }
      : {
          ...openedRoutePropsOrView,
          notOpenedContent:
            openedRoutePropsOrView.notOpenedContent ?? notOpenedContent,
        };

  return <RouteView route={openedRoute} {...openedRouteViewProps} />;
};

export const RouteGroupView = memo(
  RouteGroupViewBase,
  () => true,
) as typeof RouteGroupViewBase;

import { observer } from 'mobx-react-lite';
import { ReactNode, useLayoutEffect, useMemo } from 'react';
import { EmptyObject } from 'yummies/utils/types';

import {
  AnyAbstractRouteEntity,
  AnyRouteEntity,
  AnyRouteGroup,
  RoutesArrayCollection,
  RoutesCollection,
  RoutesObjectCollection,
} from '../../core/index.js';

import {
  RouteView,
  RouteViewComponent,
  RouteViewConfigWithRoute,
} from './route-view.js';

export type RouteGroupView<TRouteEntity extends AnyAbstractRouteEntity> =
  // route view detailed configuration
  | Omit<RouteViewConfigWithRoute<TRouteEntity>, 'route'>
  // only route view component
  | RouteViewComponent<TRouteEntity>;

export type RouteGroupViews<TRoutes extends RoutesCollection> =
  TRoutes extends RoutesArrayCollection
    ? {
        [K in keyof TRoutes]: TRoutes[K] extends AnyAbstractRouteEntity
          ? RouteGroupView<TRoutes[K]>
          : never;
      }
    : TRoutes extends RoutesObjectCollection
      ? {
          [K in keyof TRoutes]: TRoutes[K] extends AnyAbstractRouteEntity
            ? RouteGroupView<TRoutes[K]>
            : never;
        }
      : EmptyObject;

export interface RouteGroupViewProps<TRouteGroup extends AnyRouteGroup> {
  group: TRouteGroup;
  views: Partial<RouteGroupViews<TRouteGroup['routes']>>;
  onFallback?: VoidFunction;
  fallbackView?: ReactNode;
}

const RouteGroupViewBase = <TRouteGroup extends AnyRouteGroup>({
  group,
  views,
  fallbackView,
  onFallback,
}: RouteGroupViewProps<TRouteGroup>) => {
  const viewEntries = useMemo(() => Object.entries(views), []);

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

  useLayoutEffect(() => {
    if (!openedRoute) {
      onFallback?.();
    }
  }, [openedRoute]);

  if (!openedRoute) {
    return fallbackView ?? null;
  }

  const openedRouteViewProps =
    openedRoutePropsOrView &&
    (typeof openedRoutePropsOrView === 'function' ||
      'contextTypes' in openedRoutePropsOrView ||
      '$$typeof' in openedRoutePropsOrView)
      ? {
          view: openedRoutePropsOrView as any,
          fallbackView,
        }
      : {
          ...openedRoutePropsOrView,
          fallbackView: openedRoutePropsOrView?.fallbackView ?? fallbackView,
        };

  return <RouteView route={openedRoute} {...openedRouteViewProps} />;
};

export const RouteGroupView = observer(RouteGroupViewBase);

import { memo } from 'react';
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
    ? RouteGroupView<TRoutes[number]>[]
    : TRoutes extends RoutesObjectCollection
      ? {
          [K in keyof TRoutes]: RouteGroupView<TRoutes[K]>;
        }
      : EmptyObject;

export interface RouteGroupViewProps<TRouteGroup extends AnyRouteGroup> {
  group: TRouteGroup;
  views: Partial<RouteGroupViews<TRouteGroup['routes']>>;
}

export const RouteGroupView = memo(
  <TRouteGroup extends AnyRouteGroup>({
    group,
    views,
  }: RouteGroupViewProps<TRouteGroup>) => {
    const viewEntries = Object.entries(views);

    return (
      <>
        {viewEntries.map(([routeName, propsOrView]) => {
          // @ts-expect-error Object.entries is not accept types for arrays
          const route = group.routes[routeName];
          const viewProps =
            propsOrView &&
            (typeof propsOrView === 'function' ||
              'contextTypes' in propsOrView ||
              '$$typeof' in propsOrView)
              ? {
                  view: propsOrView as any,
                }
              : propsOrView;

          return <RouteView key={routeName} route={route} {...viewProps} />;
        })}
      </>
    );
  },
  () => true,
);

import { memo } from 'react';

import { AnyRouteGroup } from '../../core/index.js';

import { RouteView, RouteViewProps } from './route-view.js';

export type RouteViewCollectionProps<TRouteGroup extends AnyRouteGroup> = {
  [K in keyof TRouteGroup['routes']]:
    | Omit<RouteViewProps<TRouteGroup['routes'][K]>, 'route'>
    | Exclude<RouteViewProps<TRouteGroup['routes'][K]>['view'], undefined>;
};

export interface RouteGroupViewProps<TRouteGroup extends AnyRouteGroup> {
  group: TRouteGroup;
  views: Partial<RouteViewCollectionProps<TRouteGroup>>;
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

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
        {viewEntries.map(([routeName, props]) => {
          const route = group.routes[routeName];
          const viewProps =
            typeof props === 'function'
              ? {
                  view: props as any,
                }
              : props;
          return <RouteView key={routeName} route={route} {...viewProps} />;
        })}
      </>
    );
  },
  () => true,
);

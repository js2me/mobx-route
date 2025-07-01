import { observer } from 'mobx-react-lite';
import { ReactNode, useLayoutEffect, useMemo } from 'react';

import { AnyAbstractRouteEntity } from '../../core/index.js';

import {
  RouteView,
  RouteViewComponent,
  RouteViewConfigWithRoute,
} from './route-view.js';

export type MappedRouteView<TRouteEntity extends AnyAbstractRouteEntity> =
  // route view detailed configuration
  | Omit<RouteViewConfigWithRoute<TRouteEntity>, 'route'>
  // only route view component
  | RouteViewComponent<TRouteEntity>;

type RouteViewMapArrayType = [
  AnyAbstractRouteEntity,
  MappedRouteView<AnyAbstractRouteEntity>,
][];

// eslint-disable-next-line sonarjs/redundant-type-aliases
export type RouteViewMapType = RouteViewMapArrayType;

export interface RouteViewMapProps<TMap extends RouteViewMapType> {
  map: TMap;
  onFallback?: VoidFunction;
  fallbackView?: ReactNode;
}

const RouteViewMapBase = <TMap extends RouteViewMapType>({
  map,
  onFallback,
  fallbackView,
}: RouteViewMapProps<TMap>) => {
  const viewEntries = useMemo(() => Object.entries(map), []);

  const openedRouteEntry = viewEntries.find(([, data]) => {
    const route = data[0];
    return route.isOpened;
  });
  const openedRoute = openedRouteEntry?.[1]?.[0];
  const openedRoutePropsOrView = openedRouteEntry?.[1]?.[1];

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

export const RouteViewMap = observer(RouteViewMapBase);

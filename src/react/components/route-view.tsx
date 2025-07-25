import { observer } from 'mobx-react-lite';
import { ComponentType, ReactNode, useRef } from 'react';
import { loadable, LoadableConfig } from 'react-simple-loadable';

import {
  AnyAbstractRouteEntity,
  type AnyRoute,
  type AnyVirtualRoute,
} from '../../core/index.js';

export type RouteViewComponent<TRoute extends AnyAbstractRouteEntity> =
  ComponentType<RouteViewProps<TRoute>>;

interface RouteViewConfigWithoutRoute {
  children?: ReactNode | (() => ReactNode);
}

export interface RouteViewConfigWithRoute<TRoute extends AnyAbstractRouteEntity>
  extends Pick<LoadableConfig, 'loading' | 'preload' | 'throwOnError'> {
  route: TRoute;
  view?: RouteViewComponent<TRoute>;
  loadView?: (route: TRoute) => Promise<RouteViewComponent<TRoute>>;
  /**
   * Case when route is not opened
   */
  fallback?: ReactNode;
  children?:
    | ReactNode
    | ((params: RouteViewProps<TRoute>['params'], route: TRoute) => ReactNode);
}

export type RouteViewConfig<TRoute extends AnyAbstractRouteEntity> =
  | RouteViewConfigWithRoute<TRoute>
  | RouteViewConfigWithoutRoute;

export type RouteViewProps<TRoute extends AnyAbstractRouteEntity> = {
  children?: ReactNode;
  params: TRoute extends AnyRoute
    ? Exclude<TRoute['params'], null | undefined>
    : TRoute extends AnyVirtualRoute
      ? TRoute['params']
      : never;
};

function RouteViewBase<TRoute extends AnyAbstractRouteEntity>(
  props: Readonly<RouteViewConfig<TRoute>>,
): ReactNode {
  const lazyViewComponentRef = useRef<ComponentType<any>>();

  let Component: ComponentType<any> | undefined;

  if (!('route' in props)) {
    return typeof props.children === 'function'
      ? props.children()
      : props.children;
  }

  if (!props.route.isOpened) {
    return props.fallback ?? null;
  }

  if (props.loadView) {
    if (!lazyViewComponentRef.current) {
      lazyViewComponentRef.current = loadable({
        load: () => props.loadView!(props.route),
        loading: props.loading,
        preload: props.preload,
        throwOnError: props.throwOnError,
      });
    }
    Component = lazyViewComponentRef.current;
  } else {
    Component = props.view;
  }

  const params: any = 'params' in props.route ? props.route.params : {};

  if (Component) {
    return <Component params={params}>{props.children}</Component>;
  }

  if (typeof props.children === 'function') {
    return props.children(params, props.route);
  }

  return props.children;
}

export const RouteView = observer(RouteViewBase);

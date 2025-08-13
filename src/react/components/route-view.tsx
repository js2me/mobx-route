import { observer } from 'mobx-react-lite';
import { useRef } from 'react';
import { type LoadableConfig, loadable } from 'react-simple-loadable';

import type {
  AnyAbstractRouteEntity,
  AnyRoute,
  AnyVirtualRoute,
} from '../../core/index.js';

export type RouteViewComponent<TRoute extends AnyAbstractRouteEntity> =
  React.ComponentType<RouteViewProps<TRoute>>;

interface RouteViewConfigWithoutRoute {
  children?: React.ReactNode | (() => React.ReactNode);
}

export interface RouteViewConfigWithRoute<TRoute extends AnyAbstractRouteEntity>
  extends Pick<LoadableConfig, 'loading' | 'preload' | 'throwOnError'> {
  route: TRoute;
  view?: RouteViewComponent<TRoute>;
  loadView?: (route: TRoute) => Promise<RouteViewComponent<TRoute>>;
  /**
   * Case when route is not opened
   */
  fallback?: React.ReactNode;
  children?:
    | React.ReactNode
    | ((
        params: RouteViewProps<TRoute>['params'],
        route: TRoute,
      ) => React.ReactNode);
}

export type RouteViewConfig<TRoute extends AnyAbstractRouteEntity> =
  | RouteViewConfigWithRoute<TRoute>
  | RouteViewConfigWithoutRoute;

export type RouteViewProps<TRoute extends AnyAbstractRouteEntity> = {
  children?: React.ReactNode;
  params: TRoute extends AnyRoute
    ? Exclude<TRoute['params'], null | undefined>
    : TRoute extends AnyVirtualRoute
      ? TRoute['params']
      : never;
};

type RouteViewBaseComponent = <TRoute extends AnyAbstractRouteEntity>(
  props: RouteViewConfig<TRoute>,
) => React.ReactNode;

function RouteViewBase<TRoute extends AnyAbstractRouteEntity>(
  props: Readonly<RouteViewConfig<TRoute>>,
): React.ReactNode {
  // @ts-expect-error redundand pass first argument
  const lazyViewComponentRef = useRef<React.ComponentType<any>>();

  let Component: React.ComponentType<any> | undefined;

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

export const RouteView = observer(RouteViewBase) as RouteViewBaseComponent;

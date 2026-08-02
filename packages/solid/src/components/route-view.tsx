import type {
  AnyAbstractRouteEntity,
  AnyRoute,
  AnyVirtualRoute,
} from 'mobx-route';
import type { Component, JSX } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { useRouteViewGroup } from './route-view-group-context.js';

export type RouteViewComponent<TRoute extends AnyAbstractRouteEntity> =
  Component<RouteViewProps<TRoute>>;

interface RouteViewConfigWithoutRoute {
  children?: JSX.Element | (() => JSX.Element);
}

export interface RouteViewConfigWithRoute<
  TRoute extends AnyAbstractRouteEntity,
> {
  route: TRoute;
  view?: RouteViewComponent<TRoute>;
  /**
   * Case when route is not opened
   */
  fallback?: JSX.Element;
  children?:
    | JSX.Element
    | ((
        params: RouteViewProps<TRoute>['params'],
        route: TRoute,
      ) => JSX.Element);
}

export type RouteViewConfig<TRoute extends AnyAbstractRouteEntity> =
  | RouteViewConfigWithRoute<TRoute>
  | RouteViewConfigWithoutRoute;

export type RouteViewProps<TRoute extends AnyAbstractRouteEntity> = {
  children?: JSX.Element;
  params: TRoute extends AnyRoute
    ? Exclude<TRoute['params'], null | undefined>
    : TRoute extends AnyVirtualRoute
      ? TRoute['params']
      : never;
};

export function RouteView<TRoute extends AnyAbstractRouteEntity>(
  props: RouteViewConfig<TRoute>,
): JSX.Element {
  const group = useRouteViewGroup();

  const isWithRoute = () => 'route' in props;

  const route = () =>
    isWithRoute()
      ? (props as RouteViewConfigWithRoute<TRoute>).route
      : undefined;

  const isOpening = () => {
    const r = route();
    return r && 'isOpening' in r ? Boolean(r.isOpening) : false;
  };

  const isOpenedOrOpening = () => {
    const r = route();
    return r ? r.isOpened || isOpening() : false;
  };

  const params = () => {
    const r = route();
    return r && 'params' in r ? r.params : {};
  };

  // Register with parent RouteViewGroup if present
  if (group) {
    const r = route();
    if (r) {
      group.registerRoute(r);
    }
  }

  // No route prop — render children directly
  if (!isWithRoute()) {
    return typeof props.children === 'function'
      ? (props.children as () => JSX.Element)()
      : (props.children as JSX.Element);
  }

  // Route not opened and not opening — render fallback
  if (!isOpenedOrOpening()) {
    return ((props as RouteViewConfigWithRoute<TRoute>).fallback ??
      null) as JSX.Element;
  }

  const viewComponent = () => (props as RouteViewConfigWithRoute<TRoute>).view;
  const children = () => props.children;

  // View component provided
  if (viewComponent()) {
    return (
      <Dynamic component={viewComponent()!} params={params()}>
        {typeof children() === 'function'
          ? undefined
          : (children() as JSX.Element)}
      </Dynamic>
    );
  }

  // Render function children
  if (typeof children() === 'function') {
    return (children() as (p: any, r: any) => JSX.Element)(params(), route());
  }

  return ((children() as JSX.Element) ?? null) as JSX.Element;
}

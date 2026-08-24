import type {
  AnyAbstractRouteEntity,
  AnyRoute,
  AnyVirtualRoute,
} from 'mobx-route';
import type { Component, JSX } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { Show } from 'solid-js';
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

  // When inside a RouteViewGroup, check if this route is the active one
  const isActiveInGroup = () => {
    if (!group) return isOpenedOrOpening();
    const r = route();
    if (!r || !isOpenedOrOpening()) return false;
    const active = group.activeRoute();
    if (!active) return false;
    return active === r;
  };

  // Register with parent RouteViewGroup if present
  if (group) {
    const r = route();
    if (r) {
      group.registerRoute(r);
    }
  }

  // No route prop — these are non-route children inside RouteViewGroup
  // (e.g. <RouteView><div>not_found</div></RouteView>). Only render when
  // no route is active AND the group is not in "shouldRenderNull" state.
  if (!isWithRoute()) {
    // Use <Show> for reactive visibility — static `if` won't update
    return (
      <Show when={group ? !group.hasActiveChild() && !group.shouldRenderNull() : true}>
        {typeof props.children === 'function'
          ? (props.children as () => JSX.Element)()
          : (props.children as JSX.Element)}
      </Show>
    );
  }

  // Determine if this route view should be visible.
  // IMPORTANT: In SolidJS, component body runs once. Static `if` conditions
  // are NOT reactive. We must use <Show> for reactive conditional rendering.
  const shouldShow = () => {
    if (group) return isActiveInGroup();
    return isOpenedOrOpening();
  };

  const fallback = () =>
    ((props as RouteViewConfigWithRoute<TRoute>).fallback ?? null) as JSX.Element;

  const viewComponent = () => (props as RouteViewConfigWithRoute<TRoute>).view;
  const children = () => props.children;

  return (
    <Show when={shouldShow()} fallback={fallback()}>
      {viewComponent() ? (
        <Dynamic component={viewComponent()!} params={params()}>
          {typeof children() === 'function'
            ? undefined
            : (children() as JSX.Element)}
        </Dynamic>
      ) : typeof children() === 'function' ? (
        (children() as (p: any, r: any) => JSX.Element)(params(), route())
      ) : (
        ((children() as JSX.Element) ?? null)
      )}
    </Show>
  );
}

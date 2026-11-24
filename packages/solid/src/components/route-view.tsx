import type {
  AnyAbstractRouteEntity,
  AnyRoute,
  AnyVirtualRoute,
} from 'mobx-route';
import { type Component, type JSX, onCleanup, Show } from 'solid-js';
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

  if (!isWithRoute()) {
    return (
      <Show
        when={
          group ? !group.hasActiveChild() && !group.shouldRenderNull() : true
        }
      >
        {typeof props.children === 'function'
          ? (props.children as () => JSX.Element)()
          : (props.children as JSX.Element)}
      </Show>
    );
  }

  if (group) {
    onCleanup(group.registerRoute(route));
  }

  const shouldShow = () =>
    group ? group.activeRoute() === route() : isOpenedOrOpening();

  const viewComponent = () => (props as RouteViewConfigWithRoute<TRoute>).view;
  const children = () => props.children;

  return (
    <Show
      when={shouldShow()}
      fallback={
        group ? undefined : (props as RouteViewConfigWithRoute<TRoute>).fallback
      }
    >
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

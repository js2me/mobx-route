import { observer } from 'mobx-react-lite';
import type {
  AnyAbstractRouteEntity,
  AnyRoute,
  AnyVirtualRoute,
} from 'mobx-route';
import { type LoadableConfig, loadable } from 'react-simple-loadable';

export type RouteViewComponent<TRoute extends AnyAbstractRouteEntity> =
  React.ComponentType<RouteViewProps<TRoute>>;

interface RouteViewConfigWithoutRoute {
  children?: React.ReactNode | (() => React.ReactNode);
}

type LoadViewFn<TRoute extends AnyAbstractRouteEntity> = (
  route: TRoute,
) => Promise<RouteViewComponent<TRoute>>;

export interface RouteViewConfigWithRoute<TRoute extends AnyAbstractRouteEntity>
  extends Pick<LoadableConfig, 'loading' | 'preload' | 'throwOnError'> {
  route: TRoute;
  view?: RouteViewComponent<TRoute>;
  loadView?: LoadViewFn<TRoute>;
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
  let Component: React.ComponentType<any> | undefined;

  if (!('route' in props)) {
    return typeof props.children === 'function'
      ? props.children()
      : props.children;
  }

  if (!props.route.isOpened) {
    return props.fallback ?? null;
  }

  const loadViewFn = props.loadView as
    | (LoadViewFn<TRoute> & { _loadableComponent: any })
    | undefined;

  if (loadViewFn) {
    if (!loadViewFn._loadableComponent) {
      loadViewFn._loadableComponent = loadable({
        load: () => props.loadView!(props.route),
        loading: props.loading,
        preload: props.preload,
        throwOnError: props.throwOnError,
      });
    }
    Component = loadViewFn._loadableComponent;
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

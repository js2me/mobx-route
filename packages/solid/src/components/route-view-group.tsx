import {
  type AnyAbstractRouteEntity,
  type AnyRoute,
  buildSearchString,
  type RouteNavigateParams,
  type RouteParams,
  routeConfig,
} from 'mobx-route';
import {
  type Component,
  createMemo,
  createRenderEffect,
  createSignal,
  type JSX,
  onCleanup,
  Suspense,
} from 'solid-js';
import { Dynamic } from 'solid-js/web';
import type { IsPartial, Maybe } from 'yummies/types';
import { RouteViewGroupContext } from './route-view-group-context.js';

type LayoutComponent = Component<{ children?: JSX.Element }>;

interface BaseProps extends RouteNavigateParams {
  children: JSX.Element;
  layout?: LayoutComponent;
  useLastOpened?: boolean;
  /** When true, wraps the active route content in `<Suspense fallback={fallback}>`. */
  suspense?: boolean;
  /** Fallback content for the Suspense boundary. Only used when `suspense` is true. */
  fallback?: JSX.Element;
}

type PropsWithDefaultRoute<TRoute extends AnyAbstractRouteEntity> =
  BaseProps & {
    otherwise?: TRoute;
  } & (IsPartial<RouteParams<TRoute>> extends true
      ? {
          params?: Maybe<RouteParams<TRoute>>;
        }
      : {
          params: RouteParams<TRoute>;
        });

type PropsWithDefaultUrl = BaseProps & {
  otherwise?: string;
};

export type RouteViewGroupProps<TRoute extends AnyAbstractRouteEntity> =
  | PropsWithDefaultRoute<TRoute>
  | PropsWithDefaultUrl;

function isOpeningRoute(route: AnyAbstractRouteEntity): route is AnyRoute {
  return 'isOpening' in route;
}

export function RouteViewGroup<TRoute extends AnyAbstractRouteEntity>(
  props: RouteViewGroupProps<TRoute>,
): JSX.Element {
  const [registeredRoutes, setRegisteredRoutes] = createSignal<
    AnyAbstractRouteEntity[]
  >([]);

  const registerRoute = (route: AnyAbstractRouteEntity) => {
    setRegisteredRoutes((prev) => [...prev, route]);
  };

  const unregisterRoute = (route: AnyAbstractRouteEntity) => {
    setRegisteredRoutes((prev) => prev.filter((r) => r !== route));
  };

  // Determine active route from registered routes
  const activeRoute = createMemo(() => {
    const routes = registeredRoutes();
    const useLastOpened = (props as BaseProps).useLastOpened;

    let lastActive: AnyAbstractRouteEntity | null = null;
    let hasRoutesInOpening = false;

    for (const route of routes) {
      const isOpening = isOpeningRoute(route) && route.isOpening;
      if (route.isOpened || isOpening) {
        lastActive = route;
        if (isOpening) {
          hasRoutesInOpening = true;
        }
        if (!useLastOpened) {
          return { route, hasRoutesInOpening };
        }
      }
    }

    return lastActive ? { route: lastActive, hasRoutesInOpening } : null;
  });

  const hasActiveChild = () => !!activeRoute();

  const otherwiseNavigation = () =>
    'otherwise' in props ? props.otherwise : undefined;

  const otherwiseIsString = () => typeof otherwiseNavigation() === 'string';

  const otherwiseRoute = () =>
    !otherwiseIsString()
      ? (otherwiseNavigation() as AnyAbstractRouteEntity | undefined)
      : undefined;

  // otherwise redirect effect (equivalent to useLayoutEffect in React)
  createRenderEffect(() => {
    const otherwise = otherwiseNavigation();
    if (!hasActiveChild() && otherwise) {
      const navigateParams: RouteNavigateParams = {
        mergeQuery: props.mergeQuery,
        query: props.query,
        replace: props.replace,
        state: props.state,
      };

      if (otherwiseIsString()) {
        const history = routeConfig.get().history;
        const url = `${otherwise}${buildSearchString(navigateParams.query || {})}`;

        if (navigateParams.replace) {
          history.replace(url, navigateParams.state);
        } else {
          history.push(url, navigateParams.state);
        }
      } else {
        const oRoute = otherwiseRoute();
        if (oRoute && !oRoute.isOpened) {
          (oRoute as AnyRoute).open((props as any).params, navigateParams);
        }
      }
    }
  });

  // Cleanup: unregister routes when component unmounts
  onCleanup(() => {
    setRegisteredRoutes([]);
  });

  const layout = () => (props as BaseProps).layout;
  const useSuspense = () => (props as BaseProps).suspense;
  const fallback = () => (props as BaseProps).fallback;

  // For string otherwise: return null — effect will navigate and route opens next tick.
  const shouldRenderNullOtherwise = () =>
    otherwiseNavigation() && !hasActiveChild() && otherwiseIsString();

  const content = useSuspense() ? (
    <Suspense fallback={fallback() ?? null}>{props.children}</Suspense>
  ) : (
    props.children
  );

  const wrappedContent = layout() ? (
    <Dynamic component={layout()!}>{content}</Dynamic>
  ) : (
    content
  );

  if (shouldRenderNullOtherwise()) {
    return null as JSX.Element;
  }

  return (
    <RouteViewGroupContext.Provider value={{ registerRoute, unregisterRoute }}>
      {wrappedContent}
    </RouteViewGroupContext.Provider>
  );
}

// Re-export context for RouteView to use
export {
  RouteViewGroupContext,
  useRouteViewGroup,
} from './route-view-group-context.js';

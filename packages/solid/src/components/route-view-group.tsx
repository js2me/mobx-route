import {
  type AnyAbstractRouteEntity,
  type AnyRoute,
  buildSearchString,
  isRouteEntity,
  type RouteNavigateParams,
  type RouteParams,
  routeConfig,
} from 'mobx-route';
import {
  children,
  type Component,
  createMemo,
  createRenderEffect,
  createSignal,
  type JSX,
  onCleanup,
  Show,
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

  const useLastOpened = () => (props as BaseProps).useLastOpened;

  // With enableObservableTracking() active, MobX observables (route.isOpened,
  // route.isOpening) are automatically tracked by SolidJS createMemo.
  const activeChildInfo = createMemo(() => {
    const routes = registeredRoutes();
    const useLast = useLastOpened();

    let activeRoute: AnyAbstractRouteEntity | null = null;
    let hasRoutesInOpening = false;

    for (const route of routes) {
      const isOpening = isOpeningRoute(route) && route.isOpening;
      if (route.isOpened || isOpening) {
        activeRoute = route;
        if (isOpening) {
          hasRoutesInOpening = true;
        }
        if (!useLast) {
          return { route, hasRoutesInOpening };
        }
      }
    }

    return activeRoute
      ? { route: activeRoute, hasRoutesInOpening }
      : null;
  });

  const activeRouteEntity = createMemo(() => {
    const info = activeChildInfo();
    return info ? info.route : null;
  });

  const hasActiveChild = () => !!activeChildInfo();

  const hasRoutesInOpening = () =>
    activeChildInfo()?.hasRoutesInOpening ?? false;

  const otherwiseNavigation = () =>
    'otherwise' in props ? props.otherwise : undefined;

  const otherwiseIsString = () => typeof otherwiseNavigation() === 'string';

  const otherwiseRoute = () =>
    !otherwiseIsString()
      ? (otherwiseNavigation() as AnyAbstractRouteEntity | undefined)
      : undefined;

  // otherwise redirect effect — mirrors React's useLayoutEffect logic:
  // only fires when no route is active AND no route is in isOpening state.
  // We guard against the initial render cycle where children haven't
  // registered yet by requiring registeredRoutes().length > 0.
  createRenderEffect(() => {
    const otherwise = otherwiseNavigation();
    const routesRegistered = registeredRoutes().length > 0;
    if (!hasActiveChild() && !hasRoutesInOpening() && otherwise && routesRegistered) {
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
  // For route otherwise: don't return null — the effect opens it synchronously,
  // returning null would unmount Layout and break withViewModel auto-id VMs.
  const shouldRenderNullOtherwise = () =>
    !!(otherwiseNavigation() && !hasActiveChild() && otherwiseIsString());

  // IMPORTANT: All JSX must be rendered INSIDE the Provider so that RouteView
  // components can access the context. In SolidJS, JSX expressions are evaluated
  // eagerly when the variable is created — if we create `content` before the
  // Provider, the child component functions run before the context is set up.
  // We must NOT use <Show> to block rendering, because that would prevent
  // RouteView from registering routes (deadlock: no registration → no active
  // child → Show blocks rendering → no registration).
  return (
    <RouteViewGroupContext.Provider value={{ registerRoute, unregisterRoute, activeRoute: activeRouteEntity, hasActiveChild, useLastOpened: !!useLastOpened(), shouldRenderNull: shouldRenderNullOtherwise }}>
      {layout() ? (
        <Dynamic component={layout()!}>
          {useSuspense() ? (
            <Suspense fallback={fallback() ?? null}>{props.children}</Suspense>
          ) : (
            props.children
          )}
        </Dynamic>
      ) : useSuspense() ? (
        <Suspense fallback={fallback() ?? null}>{props.children}</Suspense>
      ) : (
        props.children
      )}
    </RouteViewGroupContext.Provider>
  );
}

// Re-export context for RouteView to use
export {
  RouteViewGroupContext,
  useRouteViewGroup,
} from './route-view-group-context.js';

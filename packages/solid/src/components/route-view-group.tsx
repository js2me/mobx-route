import {
  type AnyAbstractRouteEntity,
  type AnyRoute,
  type AnyRouteEntity,
  buildSearchString,
  type RouteNavigateParams,
  type RouteParams,
  routeConfig,
} from 'mobx-route';
import {
  type Accessor,
  type Component,
  createEffect,
  createMemo,
  createSignal,
  type JSX,
  on,
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

type PropsWithDefaultRoute<TRoute extends AnyRouteEntity> = BaseProps & {
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

export type RouteViewGroupProps<TRoute extends AnyRouteEntity> =
  | PropsWithDefaultRoute<TRoute>
  | PropsWithDefaultUrl;

function isOpeningRoute(route: AnyAbstractRouteEntity): route is AnyRoute {
  return 'isOpening' in route;
}

export function RouteViewGroup<TRoute extends AnyRouteEntity>(
  props: RouteViewGroupProps<TRoute>,
): JSX.Element {
  type RouteAccessor = Accessor<AnyAbstractRouteEntity | undefined>;
  const [registeredRoutes, setRegisteredRoutes] = createSignal<RouteAccessor[]>(
    [],
  );

  const registerRoute = (route: RouteAccessor) => {
    setRegisteredRoutes((routes) => [...routes, route]);
    return () =>
      setRegisteredRoutes((routes) => routes.filter((read) => read !== route));
  };

  const useLastOpened = () => !!props.useLastOpened;
  const activeRouteEntity = createMemo(() => {
    let activeRoute: AnyAbstractRouteEntity | null = null;
    const useLast = useLastOpened();
    for (const read of registeredRoutes()) {
      const route = read();
      if (
        route &&
        (route.isOpened || (isOpeningRoute(route) && route.isOpening))
      ) {
        activeRoute = route;
        if (!useLast) break;
      }
    }
    return activeRoute;
  });

  const hasActiveChild = createMemo(() => activeRouteEntity() !== null);
  const shouldRenderNull = () =>
    !hasActiveChild() &&
    typeof props.otherwise === 'string' &&
    !!props.otherwise;

  // Effects run after the initial render, when children have registered.
  createEffect(
    on([hasActiveChild, () => props.otherwise], ([hasActive, otherwise]) => {
      if (hasActive || !otherwise) return;

      const navigateParams: RouteNavigateParams = {
        mergeQuery: props.mergeQuery,
        query: props.query,
        replace: props.replace,
        state: props.state,
      };

      if (typeof otherwise === 'string') {
        const history = routeConfig.get().history;
        const url = `${otherwise}${buildSearchString(navigateParams.query || {})}`;

        if (navigateParams.replace) {
          history.replace(url, navigateParams.state);
        } else {
          history.push(url, navigateParams.state);
        }
      } else if (!otherwise.isOpened) {
        const params = 'params' in props ? props.params : undefined;
        void Promise.resolve(otherwise.open(params, navigateParams)).catch(
          (error) => {
            console.error(
              'Failed to open the RouteViewGroup fallback route',
              error,
            );
          },
        );
      }
    }),
  );

  const Content = () => {
    // Keep views registered while a string redirect hides the group's output.
    const content = createMemo(() =>
      props.suspense ? (
        <Suspense fallback={props.fallback}>{props.children}</Suspense>
      ) : (
        props.children
      ),
    );
    return (
      <Show when={!shouldRenderNull()}>
        <Show when={props.layout} fallback={content()}>
          {(layout) => <Dynamic component={layout()}>{content()}</Dynamic>}
        </Show>
      </Show>
    );
  };

  return (
    <RouteViewGroupContext.Provider
      value={{
        registerRoute,
        activeRoute: activeRouteEntity,
        hasActiveChild,
        useLastOpened,
        shouldRenderNull,
      }}
    >
      <Content />
    </RouteViewGroupContext.Provider>
  );
}

// Re-export context for RouteView to use
export {
  RouteViewGroupContext,
  useRouteViewGroup,
} from './route-view-group-context.js';

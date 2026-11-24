import {
  type AnyRouteEntity,
  buildSearchString,
  parsePath,
  parseSearchString,
  type RouteNavigateParams,
  type RouteParams,
  routeConfig,
} from 'mobx-route';
import {
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
import { isRouteActive } from './is-route-active.js';
import {
  type RouteRegistration,
  RouteViewGroupContext,
} from './route-view-group-context.js';

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

export function RouteViewGroup<TRoute extends AnyRouteEntity>(
  props: RouteViewGroupProps<TRoute>,
): JSX.Element {
  const [registeredRoutes, setRegisteredRoutes] = createSignal<
    RouteRegistration[]
  >([]);

  const registerRoute = (route: RouteRegistration) => {
    setRegisteredRoutes((routes) => [...routes, route]);
    return () =>
      setRegisteredRoutes((routes) => routes.filter((read) => read !== route));
  };

  const useLastOpened = () => !!props.useLastOpened;
  const activeRegistration = createMemo(() => {
    let activeRoute: RouteRegistration | undefined;
    const useLast = useLastOpened();
    for (const read of registeredRoutes()) {
      const route = read();
      if (route && isRouteActive(route)) {
        activeRoute = read;
        if (!useLast) break;
      }
    }
    return activeRoute;
  });

  const hasActiveChild = createMemo(() => !!activeRegistration());
  const hasOpenedChild = createMemo(() => !!activeRegistration()?.()?.isOpened);
  const shouldRenderNull = () =>
    !hasActiveChild() &&
    typeof props.otherwise === 'string' &&
    !!props.otherwise;

  const fallbackStatus = createMemo(() => {
    const otherwise = props.otherwise;
    if (!otherwise || typeof otherwise === 'string') return;
    if (otherwise.isOpened) return 'opened';
    return isRouteActive(otherwise) ? 'opening' : 'inactive';
  });

  let attemptedFallback = false;

  // Effects run after the initial render, when children have registered.
  createEffect(
    on(
      [hasActiveChild, hasOpenedChild, () => props.otherwise, fallbackStatus],
      ([hasActive, hasOpened, otherwise, status], previous) => {
        if (otherwise !== previous?.[2] || status === 'opened' || hasOpened) {
          attemptedFallback = false;
        }
        if (hasActive || hasOpened || !otherwise) return;

        const navigateParams: RouteNavigateParams = {
          mergeQuery: props.mergeQuery,
          query: props.query,
          replace: props.replace,
          state: props.state,
        };

        if (typeof otherwise === 'string') {
          const config = routeConfig.get();
          const mergeQuery = navigateParams.mergeQuery ?? config.mergeQuery;
          let url = otherwise;
          if (mergeQuery || navigateParams.query) {
            const {
              pathname = '',
              search = '',
              hash = '',
            } = parsePath(otherwise);
            const query = {
              ...(mergeQuery ? config.queryParams.data : undefined),
              ...parseSearchString(search),
              ...navigateParams.query,
            };
            url = `${pathname}${buildSearchString(query)}${hash}`;
          }

          if (navigateParams.replace) {
            config.history.replace(url, navigateParams.state);
          } else {
            config.history.push(url, navigateParams.state);
          }
        } else if (status === 'inactive' && !attemptedFallback) {
          // A rejected attempt can move the route back to inactive immediately.
          attemptedFallback = true;
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
      },
    ),
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
        activeRegistration,
        activeRoute: () => activeRegistration()?.() ?? null,
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

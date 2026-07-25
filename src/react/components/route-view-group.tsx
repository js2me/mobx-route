import { observer } from 'mobx-react-lite';
import {
  type AnyRoute,
  type AnyRouteEntity,
  buildSearchString,
  isRouteEntity,
  type RouteNavigateParams,
  type RouteParams,
  routeConfig,
} from 'mobx-route';
import { isValidElement, useEffect, useLayoutEffect } from 'react';
import type { IsPartial, Maybe } from 'yummies/types';

type LayoutComponent =
  | React.ComponentType<{ children?: React.ReactNode }>
  | React.ComponentType<{ children: React.ReactNode }>;

interface BaseProps extends RouteNavigateParams {
  children: React.ReactNode;
  layout?: LayoutComponent;
  useLastOpened?: boolean;
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

type RouteViewGroupComponent = <TRoute extends AnyRouteEntity>(
  props: RouteViewGroupProps<TRoute>,
) => React.ReactNode;

const useOtherwiseEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect;

export const RouteViewGroup = observer(
  <TRoute extends AnyRouteEntity>({
    children,
    layout: Layout,
    otherwise: otherwiseNavigation,
    useLastOpened,
    // @ts-expect-error
    params,
    ...navigateParams
  }: RouteViewGroupProps<TRoute>) => {
    let activeChildRouteNode: React.ReactNode = null;
    let lastInactiveChildNode: React.ReactNode = null;
    let hasRoutesInOpening = false;

    const childNodes: React.ReactNode[] = Array.isArray(children)
      ? children
      : [children];

    for (const childNode of childNodes) {
      const isRouteChild =
        isValidElement(childNode) &&
        // @ts-expect-error redundant checks better to wrap in this directive
        isRouteEntity(childNode.props?.route);

      if (isRouteChild) {
        const route = (childNode.props as any).route as AnyRoute;

        // isOpening covers confirmOpening and the Back gap — break early so
        // a later-opening virtual route (e.g. notFound) doesn't steal the slot.
        if (route.isOpened || route.isOpening) {
          activeChildRouteNode = childNode;
          if (route.isOpening) {
            hasRoutesInOpening = true;
          }
          if (!useLastOpened) {
            break;
          }
        } else {
          lastInactiveChildNode = childNode;
        }
      } else {
        lastInactiveChildNode = childNode;
      }
    }

    const hasActiveChildNode = !!activeChildRouteNode;

    const otherwiseIsString = typeof otherwiseNavigation === 'string';
    const otherwiseRoute = !otherwiseIsString ? otherwiseNavigation : undefined;

    useOtherwiseEffect(() => {
      if (!hasActiveChildNode && !hasRoutesInOpening && otherwiseNavigation) {
        if (otherwiseIsString) {
          const history = routeConfig.get().history;
          const url = `${otherwiseNavigation}${buildSearchString(navigateParams.query || {})}`;

          if (navigateParams.replace) {
            history.replace(url, navigateParams.state);
          } else {
            history.push(url, navigateParams.state);
          }
        } else if (otherwiseRoute && !otherwiseRoute.isOpened) {
          otherwiseRoute.open(params, navigateParams);
        }
      }
    }, [
      hasActiveChildNode,
      hasRoutesInOpening,
      otherwiseIsString,
      otherwiseRoute,
    ]);

    // For string otherwise: return null — effect will navigate and route opens next tick.
    // For route otherwise: don't return null — useLayoutEffect opens it synchronously,
    // returning null would unmount Layout and break withViewModel auto-id VMs.
    const shouldRenderNullOtherwise =
      otherwiseNavigation && !activeChildRouteNode && otherwiseIsString;

    if (shouldRenderNullOtherwise) {
      return null;
    }

    const resultNodeToRender =
      activeChildRouteNode ?? lastInactiveChildNode ?? null;

    if (Layout) {
      return <Layout>{resultNodeToRender}</Layout>;
    }

    return resultNodeToRender;
  },
) as unknown as RouteViewGroupComponent;

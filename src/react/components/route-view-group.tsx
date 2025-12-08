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
import { isValidElement, useEffect } from 'react';
import type { IsPartial, Maybe } from 'yummies/types';

type LayoutComponent =
  | React.ComponentType<{ children?: React.ReactNode }>
  | React.ComponentType<{ children: React.ReactNode }>;

interface BaseProps extends RouteNavigateParams {
  children: React.ReactNode;
  layout?: LayoutComponent;
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

export const RouteViewGroup = observer(
  <TRoute extends AnyRouteEntity>({
    children,
    layout: Layout,
    otherwise: otherwiseNavigation,
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
        // @ts-expect-error redundand checks better to wrap in this directive
        isRouteEntity(childNode.props?.route);

      if (isRouteChild) {
        const route = (childNode.props as any).route as AnyRoute;

        if (route.isOpened) {
          activeChildRouteNode = childNode;
          break;
        } else {
          if (route.isOpening) {
            hasRoutesInOpening = true;
          }
          lastInactiveChildNode = childNode;
        }
      } else {
        lastInactiveChildNode = childNode;
      }
    }

    const hasActiveChildNode = !!activeChildRouteNode;

    useEffect(() => {
      if (!hasActiveChildNode && !hasRoutesInOpening && otherwiseNavigation) {
        if (typeof otherwiseNavigation === 'string') {
          const history = routeConfig.get().history;
          const url = `${otherwiseNavigation}${buildSearchString(navigateParams.query || {})}`;

          if (navigateParams.replace) {
            history.replace(url, navigateParams.state);
          } else {
            history.push(url, navigateParams.state);
          }
        } else if (!otherwiseNavigation.isOpened) {
          otherwiseNavigation.open(params, navigateParams);
        }
      }
    }, [hasActiveChildNode, hasRoutesInOpening, otherwiseNavigation]);

    if (otherwiseNavigation && !activeChildRouteNode) {
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

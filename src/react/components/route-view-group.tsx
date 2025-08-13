import { buildSearchString } from 'mobx-location-history';
import { observer } from 'mobx-react-lite';
import { isValidElement, useEffect } from 'react';
import type { IsPartial, Maybe } from 'yummies/utils/types';

import {
  type AnyRouteEntity,
  type RouteNavigateParams,
  type RouteParams,
  routeConfig,
} from '../../core/index.js';
import { isRouteEntity } from '../../core/utils/is-route-entity.js';

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
    // @ts-ignore
    params,
    ...navigateParams
  }: RouteViewGroupProps<TRoute>) => {
    let activeChildNode: React.ReactNode = null;
    let lastInactiveChildNode: React.ReactNode = null;

    const childNodes: React.ReactNode[] = Array.isArray(children)
      ? children
      : [children];

    for (const childNode of childNodes) {
      if (
        isValidElement(childNode) &&
        // @ts-expect-error redundand checks better to wrap in this directive
        isRouteEntity(childNode.props?.route) &&
        // @ts-expect-error redundand checks better to wrap in this directive
        childNode.props.route.isOpened
      ) {
        activeChildNode = childNode;
        break;
      } else {
        lastInactiveChildNode = childNode;
      }
    }

    const hasActiveChildNode = !!activeChildNode;

    useEffect(() => {
      if (!hasActiveChildNode && otherwiseNavigation) {
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
    }, [hasActiveChildNode, otherwiseNavigation]);

    if (otherwiseNavigation && !activeChildNode) {
      return null;
    }

    const resultNodeToRender = activeChildNode ?? lastInactiveChildNode ?? null;

    if (Layout) {
      return <Layout>{resultNodeToRender}</Layout>;
    }

    return resultNodeToRender;
  },
) as unknown as RouteViewGroupComponent;

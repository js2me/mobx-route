/* eslint-disable sonarjs/no-nested-conditional */
/* eslint-disable unicorn/no-nested-ternary */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { buildSearchString } from 'mobx-location-history';
import { observer } from 'mobx-react-lite';
import { ComponentType, isValidElement, ReactNode, useEffect } from 'react';
import { IsPartial, Maybe } from 'yummies/utils/types';

import {
  AnyRouteEntity,
  routeConfig,
  RouteNavigateParams,
  RouteParams,
} from '../../core/index.js';
import { isRouteEntity } from '../../core/utils/is-route-entity.js';

type LayoutComponent =
  | ComponentType<{ children?: ReactNode }>
  | ComponentType<{ children: ReactNode }>;

interface BaseProps extends RouteNavigateParams {
  children: ReactNode;
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

export const RouteViewGroup = observer(function <
  TRoute extends AnyRouteEntity,
>({
  children,
  layout: Layout,
  otherwise: otherwiseNavigation,
  // @ts-ignore
  params,
  ...navigateParams
}: RouteViewGroupProps<TRoute>) {
  let activeChildNode: ReactNode = null;
  let lastInactiveChildNode: ReactNode = null;

  const childNodes: ReactNode[] = Array.isArray(children)
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
});

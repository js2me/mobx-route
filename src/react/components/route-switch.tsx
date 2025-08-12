/* eslint-disable sonarjs/no-nested-conditional */
/* eslint-disable unicorn/no-nested-ternary */
/* eslint-disable @typescript-eslint/ban-ts-comment */
import { buildSearchString } from 'mobx-location-history';
import { observer } from 'mobx-react-lite';
import { Fragment, isValidElement, ReactNode, useEffect } from 'react';
import { IsPartial, Maybe } from 'yummies/utils/types';

import {
  AnyRouteEntity,
  routeConfig,
  RouteNavigateParams,
  RouteParams,
} from '../../core/index.js';
import { isRouteEntity } from '../../core/utils/is-route-entity.js';

interface BaseProps extends RouteNavigateParams {
  children: ReactNode;
}

type PropsWithDefaultRoute<TRoute extends AnyRouteEntity> = BaseProps & {
  default?: TRoute;
} & (IsPartial<RouteParams<TRoute>> extends true
    ? {
        params?: Maybe<RouteParams<TRoute>>;
      }
    : {
        params: RouteParams<TRoute>;
      });

type PropsWithDefaultUrl = BaseProps & {
  default?: string;
};

export type SwitchProps<TRoute extends AnyRouteEntity> =
  | PropsWithDefaultRoute<TRoute>
  | PropsWithDefaultUrl;

/**
 * WIP
 */
export const Switch = observer(function <TRoute extends AnyRouteEntity>({
  children,
  default: defaultNavigation,
  // @ts-ignore
  params,
  ...navigateParams
}: SwitchProps<TRoute>) {
  let activeElement: ReactNode = null;
  let lastInactiveElement: ReactNode = null;
  let foundActive = false;

  const stack: ReactNode[] = Array.isArray(children)
    ? [...children].reverse()
    : children
      ? [children]
      : [];

  while (stack.length > 0) {
    const node = stack.pop();

    if (node == null || typeof node === 'boolean') {
      continue;
    }

    if (Array.isArray(node)) {
      for (let i = node.length - 1; i >= 0; i--) {
        stack.push(node[i]);
      }
      continue;
    }

    if (isValidElement(node) && node.type === Fragment) {
      // @ts-expect-error redundand checks better to wrap in this directive
      const fragmentChildren = node.props?.children;
      if (fragmentChildren) {
        if (Array.isArray(fragmentChildren)) {
          for (let i = fragmentChildren.length - 1; i >= 0; i--) {
            stack.push(fragmentChildren[i]);
          }
        } else {
          stack.push(fragmentChildren);
        }
      }
      continue;
    }

    let isActive = false;
    const checkStack: ReactNode[] = [node];

    while (checkStack.length > 0) {
      const checkNode = checkStack.pop();

      if (checkNode == null || typeof checkNode === 'boolean') {
        continue;
      }

      if (Array.isArray(checkNode)) {
        for (const element of checkNode) {
          checkStack.push(element);
        }
      } else if (isValidElement(checkNode)) {
        if (
          // @ts-expect-error redundand checks better to wrap in this directive
          isRouteEntity(checkNode.props?.route) &&
          // @ts-expect-error redundand checks better to wrap in this directive
          checkNode.props.route.isOpened
        ) {
          isActive = true;
          break;
        }

        // @ts-expect-error redundand checks better to wrap in this directive
        if (checkNode.props.children) {
          // @ts-expect-error redundand checks better to wrap in this directive
          checkStack.push(checkNode.props.children);
        }
      }
    }

    if (isActive) {
      activeElement = node;
      foundActive = true;
    } else {
      lastInactiveElement = node;
    }
  }

  useEffect(() => {
    if (!foundActive && defaultNavigation) {
      if (typeof defaultNavigation === 'string') {
        const history = routeConfig.get().history;
        const url = `${defaultNavigation}${buildSearchString(navigateParams.query || {})}`;

        if (navigateParams.replace) {
          history.replace(url, navigateParams.state);
        } else {
          history.push(url, navigateParams.state);
        }
      } else if (!defaultNavigation.isOpened) {
        defaultNavigation.open(params, navigateParams);
      }
    }
  }, [foundActive, defaultNavigation]);

  if (foundActive) {
    return activeElement;
  }

  if (defaultNavigation) {
    return null;
  }

  return lastInactiveElement ?? null;
});

import { buildSearchString } from 'mobx-location-history';
import { observer } from 'mobx-react-lite';
import {
  type AnchorHTMLAttributes,
  cloneElement,
  forwardRef,
  isValidElement,
  type MouseEvent,
} from 'react';
import type { AnyObject, IsPartial } from 'yummies/utils/types';

import {
  type AnyRoute,
  type InputPathParams,
  type RouteNavigateParams,
  routeConfig,
} from '../../core/index.js';

interface LinkAnchorProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  asChild?: boolean;
}

type LinkPathRouteProps<TRoute extends AnyRoute> = {
  to: TRoute;
} & (IsPartial<InputPathParams<TRoute['path']>> extends true
  ? {
      params?: InputPathParams<TRoute['path']> | null | undefined;
    }
  : { params: InputPathParams<TRoute['path']> });

type LinkSimpleRouteProps =
  | {
      to: string;
    }
  | {
      href: string;
    };

export type LinkProps<TRoute extends AnyRoute> = LinkAnchorProps &
  RouteNavigateParams &
  (LinkPathRouteProps<TRoute> | LinkSimpleRouteProps);

type LinkComponentType = <TRoute extends AnyRoute>(
  props: LinkProps<TRoute>,
) => React.ReactNode;

export const Link = observer(
  forwardRef<HTMLAnchorElement, AnyObject>(
    (
      {
        to,
        href: outerHref,
        mergeQuery,
        asChild,
        children,
        params,
        // route navigate params
        query,
        replace,
        state,
        ...outerAnchorProps
      },
      ref,
    ) => {
      const isExternalNavigation =
        outerAnchorProps.target === '_blank' ||
        outerAnchorProps.target === 'blank';

      const navigateParams: RouteNavigateParams = {
        mergeQuery,
        query,
        replace,
        state,
      };

      let href: string;

      if (outerHref) {
        href = outerHref;
      } else {
        const query =
          (mergeQuery ?? routeConfig.get().mergeQuery)
            ? { ...routeConfig.get().queryParams.data, ...navigateParams.query }
            : (navigateParams.query ?? {});

        if (typeof to === 'string') {
          href = `${to}${buildSearchString(query)}`;
        } else {
          href = (to as AnyRoute).createUrl(params, query);
        }
      }

      const handleClick = (event: MouseEvent<HTMLElement>) => {
        if (
          isExternalNavigation ||
          event.ctrlKey ||
          event.metaKey ||
          event.altKey ||
          event.shiftKey ||
          event.button !== 0
        )
          return;

        outerAnchorProps.onClick?.(event);

        if (!event.defaultPrevented && to) {
          event.preventDefault();

          if (typeof to === 'string') {
            if (navigateParams.replace) {
              routeConfig.get().history.replace(href, state);
            } else {
              routeConfig.get().history.push(href, state);
            }
          } else {
            (to as AnyRoute).open(href, navigateParams);
          }
        }
      };

      const anchorProps = {
        ...outerAnchorProps,
        href,
        onClick: handleClick,
        rel:
          outerAnchorProps.rel ??
          (isExternalNavigation ? 'noopener noreferrer' : undefined),
      };

      return asChild && isValidElement(children) ? (
        // @ts-ignore
        cloneElement(children, anchorProps)
      ) : (
        <a {...anchorProps} ref={ref}>
          {children}
        </a>
      );
    },
  ),
) as unknown as LinkComponentType;

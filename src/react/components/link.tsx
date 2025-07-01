/* eslint-disable @typescript-eslint/ban-ts-comment */
import { buildSearchString } from 'mobx-location-history';
import { observer } from 'mobx-react-lite';
import {
  AnchorHTMLAttributes,
  cloneElement,
  forwardRef,
  isValidElement,
  MouseEvent,
  ReactNode,
} from 'react';
import { AllPropertiesOptional, AnyObject } from 'yummies/utils/types';

import {
  AnyRoute,
  ExtractPathParams,
  routeConfig,
  RouteNavigateParams,
} from '../../core/index.js';

interface LinkAnchorProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  asChild?: boolean;
}

type LinkPathRouteProps<TRoute extends AnyRoute> = {
  to: TRoute;
} & (AllPropertiesOptional<ExtractPathParams<TRoute['path']>> extends true
  ? {
      // eslint-disable-next-line sonarjs/no-redundant-optional
      params?: ExtractPathParams<TRoute['path']> | null | undefined;
    }
  : { params: ExtractPathParams<TRoute['path']> });

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
) => ReactNode;

export const Link = observer(
  forwardRef<HTMLAnchorElement, AnyObject>(
    (
      {
        to,
        href: outerHref,
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
      const href =
        outerHref ??
        (typeof to === 'string'
          ? `${to}${buildSearchString(query || {})}`
          : (to as AnyRoute).createUrl(params, query));

      const handleClick = (event: MouseEvent<HTMLElement>) => {
        if (
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
            routeConfig.get().history.push(href, state);
          } else {
            (to as AnyRoute).open(href, { replace, query, state });
          }
        }
      };

      const anchorProps = {
        ...outerAnchorProps,
        href,
        onClick: handleClick,
        rel:
          outerAnchorProps.target === '_blank' && !outerAnchorProps.rel
            ? 'noopener noreferrer'
            : outerAnchorProps.rel,
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

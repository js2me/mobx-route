/* eslint-disable @typescript-eslint/ban-ts-comment */
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
  AbstractPathRouteEntity,
  AnyRoute,
  ExtractPathParams,
  RouteNavigateParams,
} from '../../core/index.js';

interface LinkAnchorProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  asChild?: boolean;
}

type LinkPathRouteProps<TRoute extends AbstractPathRouteEntity> = {
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

export type LinkProps<TRoute extends AbstractPathRouteEntity> =
  LinkAnchorProps &
    RouteNavigateParams &
    (LinkPathRouteProps<TRoute> | LinkSimpleRouteProps);

type LinkComponentType = <TRoute extends AbstractPathRouteEntity>(
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
          ? to
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

        if (!event.defaultPrevented && typeof to !== 'string') {
          event.preventDefault();
          (to as AnyRoute).open(href, { replace, query, state });
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

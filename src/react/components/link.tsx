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
  AnyRoute,
  ExtractPathParams,
  RouteNavigateParams,
} from '../../route/index.js';

export type LinkProps<TRoute extends AnyRoute> = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  'href'
> & {
  asChild?: boolean;
} & RouteNavigateParams & {
    route: TRoute;
  } & (AllPropertiesOptional<ExtractPathParams<TRoute['path']>> extends true
    ? {
        // eslint-disable-next-line sonarjs/no-redundant-optional
        params?: ExtractPathParams<TRoute['path']> | null | undefined;
      }
    : { params: ExtractPathParams<TRoute['path']> });

type LinkComponentType = <TRoute extends AnyRoute>(
  props: LinkProps<TRoute>,
) => ReactNode;

export const Link = observer(
  forwardRef<HTMLAnchorElement, AnyObject>(
    (
      { route, asChild, query, replace, children, params, ...anchorProps },
      ref,
    ) => {
      const href = (route as AnyRoute).createUrl(params, query);

      const handleClick = (event: MouseEvent<HTMLElement>) => {
        if (
          event.ctrlKey ||
          event.metaKey ||
          event.altKey ||
          event.shiftKey ||
          event.button !== 0
        )
          return;

        anchorProps.onClick?.(event);

        if (!event.defaultPrevented) {
          event.preventDefault();
          (route as AnyRoute).open(href, { replace, query });
        }
      };

      return asChild && isValidElement(children) ? (
        // @ts-ignore
        cloneElement(children, { onClick: handleClick, href })
      ) : (
        <a
          ref={ref}
          href={href}
          onClick={handleClick}
          rel={
            anchorProps.target === '_blank' && !anchorProps.rel
              ? 'noopener noreferrer'
              : anchorProps.rel
          }
        >
          {children}
        </a>
      );
    },
  ),
) as unknown as LinkComponentType;

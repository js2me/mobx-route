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
} from '../../core/index.js';

export type LinkProps<TRoute extends AnyRoute> = Omit<
  AnchorHTMLAttributes<HTMLAnchorElement>,
  'href'
> & {
  asChild?: boolean;
} & RouteNavigateParams &
  (
    | ({
        to: TRoute;
      } & (AllPropertiesOptional<ExtractPathParams<TRoute['path']>> extends true
        ? {
            // eslint-disable-next-line sonarjs/no-redundant-optional
            params?: ExtractPathParams<TRoute['path']> | null | undefined;
          }
        : { params: ExtractPathParams<TRoute['path']> }))
    | {
        to: string;
      }
  );

type LinkComponentType = <TRoute extends AnyRoute>(
  props: LinkProps<TRoute>,
) => ReactNode;

export const Link = observer(
  forwardRef<HTMLAnchorElement, AnyObject>(
    (
      { to, asChild, query, replace, children, params, ...anchorProps },
      ref,
    ) => {
      const href =
        typeof to === 'string' ? to : (to as AnyRoute).createUrl(params, query);

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

        if (!event.defaultPrevented && typeof to !== 'string') {
          event.preventDefault();
          (to as AnyRoute).open(href, { replace, query });
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

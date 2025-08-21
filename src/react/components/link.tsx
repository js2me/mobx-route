import { buildSearchString, parseSearchString } from 'mobx-location-history';
import { observer } from 'mobx-react-lite';
import {
  type AnchorHTMLAttributes,
  cloneElement,
  forwardRef,
  isValidElement,
  type MouseEvent,
  useMemo,
  useRef,
} from 'react';
import { isShallowEqual } from 'yummies/data';
import type { IsPartial } from 'yummies/utils/types';
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
  forwardRef<
    HTMLAnchorElement,
    LinkAnchorProps &
      RouteNavigateParams & {
        params?: any;
        to: string | AnyRoute;
        href: string;
      }
  >(
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
      const queryDataRef = useRef<RouteNavigateParams['query']>(query);

      if (!isShallowEqual(queryDataRef.current, query)) {
        queryDataRef.current = query;
      }

      const { href, navigateParams } = useMemo(() => {
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
          if (typeof to === 'string') {
            const isNeedToMergeQuery =
              navigateParams.mergeQuery ?? routeConfig.get().mergeQuery;

            const [path, ...querySegments] = to.split('?');

            const existedQuery = parseSearchString(querySegments.join('?'));

            const query = {
              ...(isNeedToMergeQuery ? routeConfig.get().queryParams.data : {}),
              ...existedQuery,
              ...navigateParams.query,
            };

            href = `${path}${buildSearchString(query)}`;
          } else {
            href = to.createUrl(
              params,
              navigateParams.query,
              navigateParams.mergeQuery,
            );
          }
        }

        return {
          href,
          navigateParams,
        };
      }, [mergeQuery, replace, state, to, queryDataRef.current]);

      const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
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

        if (!event.defaultPrevented) {
          event.preventDefault();

          if (navigateParams.replace) {
            routeConfig.get().history.replace(href, navigateParams.state);
          } else {
            routeConfig.get().history.push(href, navigateParams.state);
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

import {
  type AnyRoute,
  buildSearchString,
  type InputPathParams,
  parseSearchString,
  type RouteNavigateParams,
  routeConfig,
} from 'mobx-route';
import { type Component, createMemo, type JSX, Show } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import type { IsPartial, Maybe } from 'yummies/types';

interface LinkAnchorProps {
  asChild?: boolean;
  ref?: (el: HTMLAnchorElement) => void;
  onClick?: JSX.EventHandler<HTMLAnchorElement, MouseEvent>;
  target?: string;
  rel?: string;
  [key: string]: any;
}

type LinkPathRouteProps<TRoute extends AnyRoute> = {
  to: TRoute;
} & (IsPartial<InputPathParams<TRoute['pathDeclaration']>> extends true
  ? {
      params?: InputPathParams<TRoute['pathDeclaration']> | null | undefined;
    }
  : { params: InputPathParams<TRoute['pathDeclaration']> });

type LinkSimpleRouteProps =
  | {
      to: string;
    }
  | {
      href: Maybe<string>;
    };

export type LinkProps<TRoute extends AnyRoute> = LinkAnchorProps &
  RouteNavigateParams &
  (LinkPathRouteProps<TRoute> | LinkSimpleRouteProps);

export function Link<TRoute extends AnyRoute>(
  props: LinkProps<TRoute>,
): JSX.Element {
  const isExternalNavigation = () =>
    props.target === '_blank' || props.target === 'blank';

  const href = createMemo(() => {
    const navigateParams: RouteNavigateParams = {
      mergeQuery: props.mergeQuery,
      query: props.query,
      replace: props.replace,
      state: props.state,
    };

    const cfg = routeConfig.get();

    let hrefValue: string = '';

    const outerHref = 'href' in props ? props.href : undefined;

    if (outerHref) {
      hrefValue = outerHref;
    } else if ('to' in props && props.to) {
      if (typeof props.to === 'string') {
        const isNeedToMergeQuery = navigateParams.mergeQuery ?? cfg.mergeQuery;

        const [path, ...querySegments] = props.to.split('?');

        const existedQuery = parseSearchString(querySegments.join('?'));

        const query = {
          ...(isNeedToMergeQuery ? cfg.queryParams.data : {}),
          ...existedQuery,
          ...navigateParams.query,
        };

        hrefValue = `${path}${buildSearchString(query)}`;
      } else {
        hrefValue = (props.to as AnyRoute).createUrl(
          ('params' in props ? props.params : undefined) as any,
          navigateParams.query,
          navigateParams.mergeQuery,
        );
      }
    }

    return cfg.formatLinkHref?.(hrefValue) ?? hrefValue;
  });

  const handleClick = (event: MouseEvent) => {
    if (
      isExternalNavigation() ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      event.shiftKey ||
      event.button !== 0
    )
      return;

    props.onClick?.(event as any);

    const currentHref = href();

    if (
      !event.defaultPrevented &&
      !currentHref.startsWith('https://') &&
      !currentHref.startsWith('http://')
    ) {
      event.preventDefault();

      const navigateParams: RouteNavigateParams = {
        mergeQuery: props.mergeQuery,
        query: props.query,
        replace: props.replace,
        state: props.state,
      };

      if (navigateParams.replace) {
        routeConfig.get().history.replace(currentHref, navigateParams.state);
      } else {
        routeConfig.get().history.push(currentHref, navigateParams.state);
      }
    }
  };

  const anchorProps = () => {
    const {
      to,
      href: _,
      params,
      query,
      replace,
      state,
      mergeQuery,
      asChild,
      children,
      ref,
      ...rest
    } = props as any;
    return {
      ...rest,
      get href() {
        return href();
      },
      onClick: handleClick,
      get rel() {
        return (
          rest.rel ??
          (isExternalNavigation() ? 'noopener noreferrer' : undefined)
        );
      },
    };
  };

  return (
    <Show
      when={props.asChild}
      fallback={
        <a {...anchorProps()} ref={props.ref as any}>
          {props.children}
        </a>
      }
    >
      <Dynamic
        component={props.children as Component<any>}
        {...anchorProps()}
      />
    </Show>
  );
}

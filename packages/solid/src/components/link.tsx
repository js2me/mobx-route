import {
  type AnyRoute,
  buildSearchString,
  type InputPathParams,
  parseSearchString,
  type RouteNavigateParams,
  routeConfig,
} from 'mobx-route';
import { createMemo, type JSX, mergeProps, Show, splitProps } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import type { IsPartial, Maybe } from 'yummies/types';

interface LinkAnchorProps
  extends Omit<
    JSX.AnchorHTMLAttributes<HTMLAnchorElement>,
    'children' | 'href' | 'onClick' | 'ref'
  > {
  ref?: (el: HTMLAnchorElement) => void;
  onClick?: JSX.EventHandler<HTMLAnchorElement, MouseEvent>;
}

export type LinkChildProps = LinkAnchorProps & { href: string };

type LinkCompositionProps =
  | { asChild?: false; children?: JSX.Element }
  | {
      asChild: true;
      /** Render an anchor and spread the supplied props onto it. */
      children: (props: LinkChildProps) => JSX.Element;
    };

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
  LinkCompositionProps &
  RouteNavigateParams &
  (LinkPathRouteProps<TRoute> | LinkSimpleRouteProps);

const linkPropKeys = [
  'to',
  'href',
  'params',
  'query',
  'replace',
  'state',
  'mergeQuery',
  'asChild',
  'children',
  'onClick',
] as const;

export function Link<TRoute extends AnyRoute>(
  props: LinkProps<TRoute>,
): JSX.Element {
  const [, forwardedProps] = splitProps(
    props as LinkAnchorProps &
      Partial<Record<(typeof linkPropKeys)[number], unknown>>,
    linkPropKeys,
  );

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

  const handleClick: JSX.EventHandler<HTMLAnchorElement, MouseEvent> = (
    event,
  ) => {
    props.onClick?.(event);

    const currentHref = href();
    const anchor = event.currentTarget;
    const target = anchor.target.toLowerCase();
    if (
      event.defaultPrevented ||
      (target && target !== '_self') ||
      anchor.hasAttribute('download') ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      event.shiftKey ||
      event.button !== 0 ||
      /^(?:\/\/|[a-z][a-z\d+.-]*:)/i.test(currentHref.trimStart())
    ) {
      return;
    }

    event.preventDefault();
    const { history } = routeConfig.get();
    if (props.replace) {
      history.replace(currentHref, props.state);
    } else {
      history.push(currentHref, props.state);
    }
  };

  const anchorProps = mergeProps(forwardedProps, {
    get href() {
      return href();
    },
    onClick: handleClick,
    get rel() {
      const target = props.target?.toLowerCase();
      return (
        props.rel ??
        (target === '_blank' || target === 'blank'
          ? 'noopener noreferrer'
          : undefined)
      );
    },
  });

  return (
    <Show
      when={props.asChild && props.children}
      keyed
      fallback={
        <Dynamic component="a" {...anchorProps}>
          {!props.asChild && props.children}
        </Dynamic>
      }
    >
      {(renderChild) => renderChild(anchorProps)}
    </Show>
  );
}

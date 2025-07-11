import { ParseOptions } from 'path-to-regexp';
import { IsPartial, AnyObject, Maybe, MaybePromise } from 'yummies/utils/types';

import { RouteGlobalConfig } from '../config/config.types.js';
import { AnyAbstractRouteEntity } from '../route-group/route-group.types.js';

import { Route } from './route.js';

export type PreparedNavigationData<TParams extends AnyObject = AnyObject> = {
  state?: any;

  /**
   * path parameters
   *
   * can be received from extended routes
   */
  params?: TParams;

  url: string;

  replace?: boolean;

  query?: AnyObject;
};

/**
 * Returning `false` means ignore navigation
 */
export type BeforeOpenFeedback =
  | void
  | boolean
  | {
      url: string;
      state?: any;
      replace?: boolean;
    };

export interface AbstractPathRoute<TPath extends string = string> {
  isOpened: boolean;
  path: TPath;
}

export interface RouteConfiguration<
  TPath extends string,
  TParams extends AnyObject = ParsedPathParams<TPath>,
  TParentRoute extends Route<string, any, any> | null = null,
> extends Partial<RouteGlobalConfig> {
  abortSignal?: AbortSignal;
  index?: boolean;
  hash?: boolean;
  meta?: AnyObject;
  parseOptions?: ParseOptions;
  parent?: TParentRoute;
  children?: AnyRoute[];
  params?: (params: ExtractPathParams<TPath>) => TParams | null | false;
  checkOpened?: (parsedPathData: ParsedPathData<NoInfer<TPath>>) => boolean;
  beforeOpen?: (
    preparedNavigationData: PreparedNavigationData<NoInfer<TParams>>,
  ) => MaybePromise<BeforeOpenFeedback>;
  afterClose?: () => void;
  afterOpen?: (
    data: ParsedPathData<NoInfer<TPath>>,
    route: Route<NoInfer<TPath>, NoInfer<TParams>, NoInfer<TParentRoute>>,
  ) => void;
}

export type AnyRoute = IRoute;

export interface IRoute<TPath extends string = string> {
  isOpened: boolean;
  path: TPath;

  /**
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#hasopenedchildren-boolean)
   */
  hasOpenedChildren: boolean;

  /**
   * Navigates to this route.
   *
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#open-args)
   */
  open(
    ...args: IsPartial<ExtractPathParams<TPath>> extends true
      ? [
          params?: ExtractPathParams<TPath> | null | undefined,
          navigateParams?: RouteNavigateParams,
        ]
      : [params: ExtractPathParams<TPath>, navigateParams?: RouteNavigateParams]
  ): Promise<void>;
  open(
    ...args: IsPartial<ExtractPathParams<TPath>> extends true
      ? [
          params?: ExtractPathParams<TPath> | null | undefined,
          replace?: RouteNavigateParams['replace'],
          query?: RouteNavigateParams['query'],
        ]
      : [
          params: ExtractPathParams<TPath>,
          replace?: RouteNavigateParams['replace'],
          query?: RouteNavigateParams['query'],
        ]
  ): Promise<void>;
  open(url: string, navigateParams?: RouteNavigateParams): Promise<void>;
  open(
    url: string,
    replace?: RouteNavigateParams['replace'],
    query?: RouteNavigateParams['query'],
  ): Promise<void>;

  createUrl(
    ...args: IsPartial<ExtractPathParams<TPath>> extends true
      ? [params?: Maybe<ExtractPathParams<TPath>>, query?: AnyObject]
      : [params: ExtractPathParams<TPath>, query?: AnyObject]
  ): string;

  destroy(): void;

  params: any;
}

export type PathParam = string | number | boolean | null;
// eslint-disable-next-line sonarjs/redundant-type-aliases
export type PathParsedParam = string;

type Simplify<T> = T extends infer U ? { [K in keyof U]: U[K] } : never;

export type RouteParams<TRoute extends AnyAbstractRouteEntity> =
  TRoute extends { path: string }
    ? ParsedPathParams<TRoute['path']>
    : TRoute extends { params: infer TParams }
      ? Exclude<TParams, null>
      : AnyObject;

export type ParsedPathParams<Path extends string> = Simplify<
  Path extends `${infer Prefix}{${infer Optional}}${infer Suffix}`
    ? ParsedPathParams<`${Prefix}${Suffix}`> &
        Partial<ParsedPathParams<Optional>>
    : Path extends `${infer PartA}/${infer PartB}`
      ? ParsedPathParams<PartA> & ParsedPathParams<PartB>
      : Path extends `:${infer Param}?`
        ? { [K in Param]?: PathParsedParam }
        : Path extends `:${infer Param}`
          ? { [K in Param]: PathParsedParam }
          : Path extends `*${infer Wildcard}`
            ? { [K in Wildcard]: PathParsedParam[] }
            : // eslint-disable-next-line @typescript-eslint/ban-types
              {}
>;

export type ExtractPathParams<Path extends string> = Simplify<
  Path extends `${infer Prefix}{${infer Optional}}${infer Suffix}`
    ? ExtractPathParams<`${Prefix}${Suffix}`> &
        Partial<ExtractPathParams<Optional>>
    : Path extends `${infer PartA}/${infer PartB}`
      ? ExtractPathParams<PartA> & ExtractPathParams<PartB>
      : Path extends `:${infer Param}?`
        ? { [K in Param]?: PathParam }
        : Path extends `:${infer Param}`
          ? { [K in Param]: PathParam }
          : Path extends `*${infer Wildcard}`
            ? { [K in Wildcard]: PathParam[] }
            : // eslint-disable-next-line @typescript-eslint/ban-types
              {}
>;

export interface RouteNavigateParams {
  replace?: boolean;
  state?: any;
  query?: AnyObject;
}

export interface ParsedPathData<TPath extends string> {
  path: string;
  params: ParsedPathParams<TPath>;
}

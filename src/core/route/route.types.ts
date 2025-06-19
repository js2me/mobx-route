import { IQueryParams } from 'mobx-location-history';
import { ParseOptions } from 'path-to-regexp';
import { AnyObject, MaybePromise } from 'yummies/utils/types';

import { RouteGlobalConfig } from '../config/config.types.js';

import { Route } from './route.js';

export interface ReadOnlyRoute<
  TPath extends string,
  TParams extends AnyObject = ExtractPathParams<TPath>,
  TParentRoute extends AnyRoute | null = null,
> {
  readonly parent: NoInfer<TParentRoute>;
  readonly query: IQueryParams;
  /**
   * Indicates if this route is an index route. Index routes activate when parent route path matches exactly.
   *
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#isindex-boolean)
   */
  readonly isIndex: boolean;
  /**
   * Indicates if this route is an hash route.
   *
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#ishash-boolean)
   */
  readonly isHash: boolean;
  readonly children: AnyRoute[];
  /**
   * Matched path segment for current URL.
   *
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#currentpath-parsedpathname-null)
   */
  readonly currentPath: string | null;
  /**
   * Current parsed path parameters.
   *
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#params-parsedpathparams-null)
   */
  readonly params: TParams | null;
  /**
   * Defines the "open" state for this route.
   *
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#isopened-boolean)
   */
  readonly isOpened: boolean;
  /**
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#hasopenedchildren-boolean)
   */
  readonly hasOpenedChildren: boolean;
}

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

export interface RouteConfiguration<
  TPath extends string,
  TParams extends AnyObject = ParsedPathParams<TPath>,
  TParentRoute extends AnyRoute | null = null,
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
    route: ReadOnlyRoute<
      NoInfer<TPath>,
      NoInfer<TParams>,
      NoInfer<TParentRoute>
    >,
  ) => void;
}

export type AnyReadOnlyRoute = ReadOnlyRoute<string, any, any>;

export type AnyRoute = Route<string, any, any>;

export type PathParam = string | number | boolean | null;
// eslint-disable-next-line sonarjs/redundant-type-aliases
export type PathParsedParam = string;

type Simplify<T> = T extends infer U ? { [K in keyof U]: U[K] } : never;

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

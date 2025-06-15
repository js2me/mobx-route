import { ParseOptions } from 'path-to-regexp';
import { AnyObject, MaybePromise } from 'yummies/utils/types';

import { RouteGlobalConfig } from '../config/config.types.js';

import type { Route } from './route.js';

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
export type BeforeEnterFeedback =
  | void
  | boolean
  | {
      url: string;
      state?: any;
      replace?: boolean;
    };

export type AfterLeaveFeedback =
  | void
  | boolean
  | {
      url: string;
      state?: any;
      replace?: boolean;
    };

export type BeforeOpenHandler<TParams extends AnyObject = AnyObject> = (
  preparedNavigationData: PreparedNavigationData<TParams>,
) => MaybePromise<BeforeEnterFeedback>;

export type AfterCloseHandler = () => void;

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
  beforeOpen?: BeforeOpenHandler<NoInfer<TParams>>;
  afterClose?: AfterCloseHandler;
  onOpen?: (
    data: ParsedPathData<NoInfer<TPath>>,
    route: Route<NoInfer<TPath>, NoInfer<TParams>, NoInfer<TParentRoute>>,
  ) => void;
}

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

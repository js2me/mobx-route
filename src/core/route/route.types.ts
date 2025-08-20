import type { ParseOptions } from 'path-to-regexp';
import type {
  AnyObject,
  IsPartial,
  Maybe,
  MaybePromise,
} from 'yummies/utils/types';

import type { RouteGlobalConfig } from '../config/config.types.js';
import type { AnyAbstractRouteEntity } from '../route-group/route-group.types.js';
import type { VirtualRoute } from '../virtual-route/virtual-route.js';

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
  TInputParams extends InputPathParams<TPath> = InputPathParams<TPath>,
  TOutputParams extends AnyObject = ParsedPathParams<TPath>,
  TParentRoute extends Route<string, any, any, any> | null = null,
> extends Partial<RouteGlobalConfig> {
  /**
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#abortsignal)
   */
  abortSignal?: AbortSignal;
  index?: boolean;
  hash?: boolean;
  /**
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#meta)
   */
  meta?: AnyObject;
  parseOptions?: ParseOptions;
  parent?: TParentRoute;
  children?: AnyRoute[];
  /**
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#params)
   */
  params?: (
    params: ParsedPathParams<TPath>,
    meta: AnyObject | undefined,
  ) => TOutputParams | null | false;
  /**
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#checkopened)
   */
  checkOpened?: (parsedPathData: ParsedPathData<NoInfer<TPath>>) => boolean;
  /**
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#beforeopen)
   */
  beforeOpen?: (
    preparedNavigationData: PreparedNavigationData<NoInfer<TInputParams>>,
  ) => MaybePromise<BeforeOpenFeedback>;
  /**
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#afterclose)
   */
  afterClose?: () => void;
  /**
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#afteropen)
   */
  afterOpen?: (
    data: ParsedPathData<NoInfer<TPath>>,
    route: Route<
      NoInfer<TPath>,
      NoInfer<TInputParams>,
      NoInfer<TOutputParams>,
      NoInfer<TParentRoute>
    >,
  ) => void;
}

export type AnyRoute = IRoute;

export interface IRoute<
  TPath extends string = string,
  TInputParams extends InputPathParams<TPath> = InputPathParams<TPath>,
  TOutputParams extends AnyObject = ParsedPathParams<TPath>,
> {
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
    ...args: IsPartial<TInputParams> extends true
      ? [
          params?: TInputParams | null | undefined,
          navigateParams?: RouteNavigateParams,
        ]
      : [params: TInputParams, navigateParams?: RouteNavigateParams]
  ): Promise<void>;
  open(
    ...args: IsPartial<TInputParams> extends true
      ? [
          params?: TInputParams | null | undefined,
          replace?: RouteNavigateParams['replace'],
          query?: RouteNavigateParams['query'],
        ]
      : [
          params: TInputParams,
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
    ...args: IsPartial<TInputParams> extends true
      ? [params?: Maybe<TInputParams>, query?: AnyObject]
      : [params: TInputParams, query?: AnyObject]
  ): string;

  destroy(): void;

  readonly params: TOutputParams | null;
}

export type InputPathParam = string | number | boolean | null;

export type ParsedPathParam = string;

type Simplify<T> = T extends infer U ? { [K in keyof U]: U[K] } : never;

export type RouteParams<TRoute extends AnyAbstractRouteEntity> =
  TRoute extends { path: string }
    ? ParsedPathParams<TRoute['path']>
    : TRoute extends { params: infer TParams }
      ? Exclude<TParams, null>
      : AnyObject;

export type PathToObject<
  Path extends string,
  PropertyValue = string,
> = Simplify<
  Path extends `${infer Prefix}{${infer Optional}}${infer Suffix}`
    ? PathToObject<`${Prefix}${Suffix}`, PropertyValue> &
        Partial<PathToObject<Optional, PropertyValue>>
    : Path extends `${infer PartA}/${infer PartB}`
      ? PathToObject<PartA, PropertyValue> & PathToObject<PartB, PropertyValue>
      : Path extends `:${infer Param}?`
        ? { [K in Param]?: PropertyValue }
        : Path extends `:${infer Param}`
          ? { [K in Param]: PropertyValue }
          : Path extends `*${infer Wildcard}`
            ? { [K in Wildcard]: PropertyValue[] }
            : {}
>;

export type ParsedPathParams<Path extends string> = PathToObject<
  Path,
  ParsedPathParam
>;

export type InputPathParams<Path extends string> = PathToObject<
  Path,
  InputPathParam
>;

export interface RouteNavigateParams {
  replace?: boolean;
  state?: any;
  query?: AnyObject;
  mergeQuery?: boolean;
}

export interface ParsedPathData<TPath extends string> {
  path: string;
  params: ParsedPathParams<TPath>;
}

export type InferPath<T extends AnyRoute> = T extends IRoute<
  infer TPath,
  any,
  any
>
  ? TPath
  : never;

export type InferInputParams<T extends AnyRoute> = T extends VirtualRoute<
  infer TParams
>
  ? TParams
  : T extends IRoute<any, infer TInputParams, any>
    ? TInputParams
    : never;

export type InferParams<T extends AnyRoute> = T extends VirtualRoute<
  infer TParams
>
  ? TParams
  : T extends IRoute<any, any, infer TParams>
    ? TParams
    : never;

import { ParseOptions } from 'path-to-regexp';
import { AnyObject } from 'yummies/utils/types';

import { RouteGlobalConfig } from '../config/config.types.js';

import type { Route } from './route.js';

export type OpenData = {
  state?: any;

  /**
   * path parameters
   *
   * can be received from extended routes
   */
  params?: AnyObject;

  url: string;

  replace?: boolean;

  query?: AnyObject;
};

/**
 * Returning `false` means ignore navigation
 */
export type BeforeOpenCheckResult =
  | void
  | boolean
  | {
      url: string;
      state?: any;
      replace?: boolean;
    };

export type BeforeOpenHandler = (
  openData: OpenData,
) => BeforeOpenCheckResult | Promise<BeforeOpenCheckResult>;

export type RouteOpenedChecker = (data: AnyObject) => boolean;

export interface RouteConfiguration<
  TPath extends string,
  TParentRoute extends AnyRoute | null = null,
> extends Partial<Omit<RouteGlobalConfig, 'useHashRouting'>> {
  abortSignal?: AbortSignal;
  index?: boolean;
  hash?: boolean;
  meta?: AnyObject;
  parseOptions?: ParseOptions;
  parent?: TParentRoute;
  children?: AnyRoute[];
  checkOpened?: RouteOpenedChecker;
  beforeOpen?: BeforeOpenHandler;
  onOpen?: (
    data: RouteMatchesData<TPath>,
    route: Route<TPath, TParentRoute>,
  ) => void;
  onClose?: () => void;
}

export type AnyRoute = Route<string, any>;

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

export interface RouteMatchesData<TPath extends string> {
  path: string;
  params: ParsedPathParams<TPath>;
}

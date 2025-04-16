import {
  IMobxHistory,
  IMobxLocation,
  IQueryParams,
} from 'mobx-location-history';
import { ParseOptions } from 'path-to-regexp';

import type { Route } from './route.js';

export interface RouteGlobalConfiguration {
  history: IMobxHistory;
  location: IMobxLocation;
  queryParams: IQueryParams;
}

export interface RouteConfiguration<TParentRoute extends AnyRoute | null = null>
  extends Partial<RouteGlobalConfiguration> {
  baseUrl?: string;
  meta?: Record<string, any>;
  parseOptions?: ParseOptions;
  parent?: TParentRoute;
}

export type AnyRoute = Route<any, any>;

type ParamInputValue = string | number | boolean | null | undefined;
// eslint-disable-next-line sonarjs/redundant-type-aliases
type ParamParsedValue = string;

type Simplify<T> = T extends infer U ? { [K in keyof U]: U[K] } : never;

export type ParsedPathParams<Path extends string> = Simplify<
  Path extends `${infer Prefix}{${infer Optional}}${infer Suffix}`
    ? ParsedPathParams<`${Prefix}${Suffix}`> &
        Partial<ParsedPathParams<Optional>>
    : Path extends `${infer PartA}/${infer PartB}`
      ? ParsedPathParams<PartA> & ParsedPathParams<PartB>
      : Path extends `:${infer Param}?`
        ? { [K in Param]?: ParamParsedValue }
        : Path extends `:${infer Param}`
          ? { [K in Param]: ParamParsedValue }
          : Path extends `*${infer Wildcard}`
            ? { [K in Wildcard]: ParamParsedValue[] }
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
        ? { [K in Param]?: ParamInputValue }
        : Path extends `:${infer Param}`
          ? { [K in Param]: ParamInputValue }
          : Path extends `*${infer Wildcard}`
            ? { [K in Wildcard]: ParamInputValue[] }
            : // eslint-disable-next-line @typescript-eslint/ban-types
              {}
>;

export interface RouteNavigateParams {
  replace?: boolean;
  query?: Record<string, any>;
}

export interface RouteMatchesData<TPath extends string> {
  path: string;
  params: ParsedPathParams<TPath>;
}

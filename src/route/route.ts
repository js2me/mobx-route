import { computed, makeObservable } from 'mobx';
import {
  buildSearchString,
  IMobxHistory,
  IMobxLocation,
  IQueryParams,
  MobxHistory,
  MobxLocation,
  QueryParams,
} from 'mobx-location-history';
import { compile, match, ParamData, parse, TokenData } from 'path-to-regexp';
import { AllPropertiesOptional } from 'yummies/utils/types';

import {
  ExtractPathParams,
  RouteConfiguration,
  RouteGlobalConfiguration,
  RouteMatchesData,
  RouteNavigateParams,
} from './route.types.js';

export class Route<
  TPath extends string,
  TParentRoute extends Route<any, any> | null = null,
> {
  protected history: IMobxHistory;
  protected location: IMobxLocation;

  query: IQueryParams;

  private _tokenData: TokenData | undefined;

  constructor(
    public path: TPath,
    protected config: RouteConfiguration<TParentRoute> = {},
  ) {
    this.history = config.history ?? Route.globalConfiguration.history;
    this.location = config.location ?? Route.globalConfiguration.location;
    this.query = config.queryParams ?? Route.globalConfiguration.queryParams;

    computed.struct(this, 'isMatches');
    computed.struct(this, 'matchData');

    makeObservable(this);
  }

  get matchData(): RouteMatchesData<TPath> | null {
    let pathname = this.location.pathname;

    if (this.baseUrl) {
      if (!pathname.startsWith(this.baseUrl)) {
        return null;
      }

      pathname = pathname.replace(this.baseUrl, '');
    }

    const parsed = match(this.tokenData)(pathname);

    if (parsed === false) {
      return null;
    }

    return parsed as RouteMatchesData<TPath>;
  }

  get isMatches() {
    return this.matchData !== null;
  }

  extend<TExtendedPath extends string>(
    path: TExtendedPath,
    config?: Omit<RouteConfiguration<any>, 'parent'>,
  ) {
    type ExtendedRoutePath = `${TPath}${TExtendedPath}`;
    type ParentRoute = this;

    return new Route<ExtendedRoutePath, ParentRoute>(`${this.path}${path}`, {
      ...this.config,
      ...config,
      parent: this,
    } as any);
  }

  protected processParams(
    params?: ExtractPathParams<TPath> | null | undefined,
  ): ParamData | undefined {
    if (params == null) return undefined;

    return Object.entries(params).reduce((acc, [key, value]) => {
      if (value != null) {
        acc[key] = Array.isArray(value) ? value.map(String) : String(value);
      }
      return acc;
    }, {} as ParamData);
  }

  protected get baseUrl() {
    return !this.config.baseUrl || this.config.baseUrl === '/'
      ? ''
      : this.config.baseUrl;
  }

  createUrl(
    ...args: AllPropertiesOptional<ExtractPathParams<TPath>> extends true
      ? [
          params?: ExtractPathParams<TPath> | null | undefined,
          query?: Record<string, any>,
        ]
      : [params: ExtractPathParams<TPath>, query?: Record<string, any>]
  ) {
    const pathParams = args[0];
    const queryParams = args[1];

    const path = compile(this.tokenData)(this.processParams(pathParams));

    return [
      this.baseUrl,
      // type === 'hash' ? '#' : '',
      path,
      buildSearchString(queryParams || {}),
    ].join('');
  }

  navigate(
    ...args: AllPropertiesOptional<ExtractPathParams<TPath>> extends true
      ? [
          params?: ExtractPathParams<TPath> | null | undefined,
          navigateParams?: RouteNavigateParams,
        ]
      : [params: ExtractPathParams<TPath>, navigateParams?: RouteNavigateParams]
  ) {
    // @ts-expect-error no way to handle typigns here
    const url = this.createUrl(args[0], args[1]?.query);
    if (args[1]?.replace) {
      this.history.replaceState(null, '', url);
    } else {
      this.history.pushState(null, '', url);
    }
  }

  protected get tokenData() {
    if (!this._tokenData) {
      this._tokenData = parse(this.path, this.config.parseOptions);
    }
    return this._tokenData;
  }

  private static _globalConfiguration: RouteGlobalConfiguration | undefined;

  static setGlobalConfiguration(
    globalConfiguration: Partial<RouteGlobalConfiguration>,
  ) {
    const history = globalConfiguration.history ?? new MobxHistory();
    const location = globalConfiguration.location ?? new MobxLocation(history);
    const queryParams =
      globalConfiguration.queryParams ?? new QueryParams(location, history);

    const config: RouteGlobalConfiguration = {
      history,
      location,
      queryParams,
    };

    this._globalConfiguration = config;
  }

  static get globalConfiguration() {
    if (!this._globalConfiguration) {
      this.setGlobalConfiguration({});
    }

    return this._globalConfiguration!;
  }
}

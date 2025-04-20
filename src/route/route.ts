import { action, computed, makeObservable, observable } from 'mobx';
import {
  buildSearchString,
  IMobxHistory,
  IMobxLocation,
  IQueryParams,
} from 'mobx-location-history';
import { compile, match, ParamData, parse, TokenData } from 'path-to-regexp';
import { AllPropertiesOptional, AnyObject, Maybe } from 'yummies/utils/types';

import { routeConfig } from '../config/config.js';

import {
  AnyRoute,
  ExtractPathParams,
  RouteConfiguration,
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

  children: AnyRoute[] = [];

  constructor(
    public path: TPath,
    protected config: RouteConfiguration<TParentRoute> = {},
  ) {
    const defaults = routeConfig.get();
    this.history = config.history ?? defaults.history;
    this.location = config.location ?? defaults.location;
    this.query = config.queryParams ?? defaults.queryParams;

    computed.struct(this, 'isMatches');
    computed.struct(this, 'matchData');
    computed.struct(this, 'hasChildrenMatches');
    observable(this, 'children');
    action(this, 'addChildren');
    action(this, 'removeChildren');

    makeObservable(this);
  }

  get data(): RouteMatchesData<TPath> | null {
    let pathname = this.location.pathname;

    if (this.baseUrl) {
      if (!pathname.startsWith(this.baseUrl)) {
        return null;
      }

      pathname = pathname.replace(this.baseUrl, '');
    }

    if ((this.path === '' || this.path === '/') && pathname === '/') {
      return { params: {} as any, path: pathname };
    }

    const parsed = match(this.tokenData)(pathname);

    if (parsed === false) {
      return null;
    }

    return parsed as RouteMatchesData<TPath>;
  }

  get isOpened() {
    return this.data !== null;
  }

  get isIndex() {
    return !!this.config.index;
  }

  extend<TExtendPath extends string>(
    path: TExtendPath,
    config?: Omit<RouteConfiguration<any>, 'parent'>,
  ) {
    type ExtendedRoutePath = `${TPath}${TExtendPath}`;
    type ParentRoute = this;

    const extendedChild = new Route<ExtendedRoutePath, ParentRoute>(
      `${this.path}${path}`,
      {
        ...this.config,
        ...config,
        parent: this,
      } as any,
    );

    this.addChildren(extendedChild);

    return extendedChild;
  }

  addChildren(...children: AnyRoute[]) {
    this.children.push(...children);
  }

  removeChildren(...childrenToRemove: AnyRoute[]) {
    this.children = this.children.filter(
      (child) => !childrenToRemove.includes(child),
    );
  }

  get hasChildrenMatches() {
    return this.children.some((child) => child.isOpened);
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
    const usedBaseUrl = this.config.baseUrl ?? routeConfig.get().baseUrl;

    return !usedBaseUrl || usedBaseUrl === '/' ? '' : usedBaseUrl;
  }

  createUrl(
    ...args: AllPropertiesOptional<ExtractPathParams<TPath>> extends true
      ? [params?: Maybe<ExtractPathParams<TPath>>, query?: AnyObject]
      : [params: ExtractPathParams<TPath>, query?: AnyObject]
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

  open(
    ...args: AllPropertiesOptional<ExtractPathParams<TPath>> extends true
      ? [
          params?: ExtractPathParams<TPath> | null | undefined,
          navigateParams?: RouteNavigateParams,
        ]
      : [params: ExtractPathParams<TPath>, navigateParams?: RouteNavigateParams]
  ): void;

  open(url: string, navigateParams?: RouteNavigateParams): void;

  open(...args: any[]) {
    const url =
      typeof args[0] === 'string'
        ? args[0]
        : this.createUrl(args[0], args[1]?.query);
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
}

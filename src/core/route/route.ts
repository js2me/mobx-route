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
  ParsedPathParams,
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
  protected baseUrl: string;

  query: IQueryParams;

  private _tokenData: TokenData | undefined;
  private _matcher?: ReturnType<typeof match>;
  private _compiler?: ReturnType<typeof compile>;

  children: AnyRoute[] = [];

  constructor(
    public path: TPath,
    protected config: RouteConfiguration<TParentRoute> = {},
  ) {
    this.history = config.history ?? routeConfig.get().history;
    this.location = config.location ?? routeConfig.get().location;
    this.query = config.queryParams ?? routeConfig.get().queryParams;
    const usedBaseUrl = this.config.baseUrl ?? routeConfig.get().baseUrl;
    this.baseUrl = !usedBaseUrl || usedBaseUrl === '/' ? '' : usedBaseUrl;

    computed.struct(this, 'isOpened');
    computed.struct(this, 'data');
    computed.struct(this, 'params');
    computed.struct(this, 'currentPath');
    computed.struct(this, 'hasOpenedChildren');

    observable(this, 'children');
    action(this, 'addChildren');
    action(this, 'removeChildren');

    makeObservable(this);
  }

  protected get data(): RouteMatchesData<TPath> | null {
    let pathname = this.location.pathname;

    if (this.baseUrl) {
      if (!pathname.startsWith(this.baseUrl)) {
        return null;
      }

      pathname = pathname.replace(this.baseUrl, '');
    }

    if (
      (this.path === '' || this.path === '/') &&
      (pathname === '/' || pathname === '')
    ) {
      return { params: {} as any, path: pathname };
    }

    const matcher = this._matcher ?? (this._matcher = match(this.tokenData));
    const parsed = matcher(pathname);

    if (parsed === false) {
      return null;
    }

    return parsed as RouteMatchesData<TPath>;
  }

  get currentPath(): string | null {
    return this.data?.path ?? null;
  }

  get params(): ParsedPathParams<TPath> | null {
    return this.data?.params ?? null;
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

  protected addChildren(...children: AnyRoute[]) {
    this.children.push(...children);
  }

  protected removeChildren(...childrenToRemove: AnyRoute[]) {
    this.children = this.children.filter(
      (child) => !childrenToRemove.includes(child),
    );
  }

  get hasOpenedChildren() {
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

  createUrl(
    ...args: AllPropertiesOptional<ExtractPathParams<TPath>> extends true
      ? [params?: Maybe<ExtractPathParams<TPath>>, query?: AnyObject]
      : [params: ExtractPathParams<TPath>, query?: AnyObject]
  ) {
    const pathParams = args[0];
    const queryParams = args[1];

    const compiler =
      this._compiler ?? (this._compiler = compile(this.tokenData));
    const path = compiler(this.processParams(pathParams));

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

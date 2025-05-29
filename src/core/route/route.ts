/* eslint-disable prefer-const */
import { LinkedAbortController } from 'linked-abort-controller';
import { action, computed, makeObservable, observable, reaction } from 'mobx';
import {
  buildSearchString,
  History,
  IQueryParams,
} from 'mobx-location-history';
import { compile, match, ParamData, parse, TokenData } from 'path-to-regexp';
import { AllPropertiesOptional, AnyObject, Maybe } from 'yummies/utils/types';

import { routeConfig } from '../config/config.js';

import {
  AnyRoute,
  BeforeOpenCheckResult,
  OpenData,
  ExtractPathParams,
  ParsedPathParams,
  RouteConfiguration,
  RouteMatchesData,
  RouteNavigateParams,
} from './route.types.js';

/**
 * Class for creating path based route.
 *
 * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html)
 */
export class Route<
  TPath extends string,
  TParentRoute extends Route<any, any> | null = null,
> extends String {
  protected abortController: AbortController;
  protected history: History;
  parent: TParentRoute;

  query: IQueryParams;

  private _tokenData: TokenData | undefined;
  private _matcher?: ReturnType<typeof match>;
  private _compiler?: ReturnType<typeof compile>;

  /**
   * Indicates if this route is an index route. Index routes activate when parent route path matches exactly.
   *
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#isindex-boolean)
   */
  isIndex: boolean;

  /**
   * Indicates if this route is an hash route.
   *
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#ishash-boolean)
   */
  isHash: boolean;

  children: AnyRoute[] = [];

  constructor(
    public path: TPath,
    protected config: RouteConfiguration<TPath, TParentRoute> = {},
  ) {
    super(path);

    this.abortController = new LinkedAbortController(config.abortSignal);
    this.history = config.history ?? routeConfig.get().history;
    this.query = config.queryParams ?? routeConfig.get().queryParams;
    this.isIndex = !!this.config.index;
    this.isHash = this.config.hash ?? !!routeConfig.get().useHashRouting;
    this.parent = config.parent ?? (null as unknown as TParentRoute);

    computed.struct(this, 'isOpened');
    computed.struct(this, 'data');
    computed.struct(this, 'params');
    computed.struct(this, 'currentPath');
    computed.struct(this, 'hasOpenedChildren');
    computed(this, 'baseUrl');

    observable(this, 'children');
    observable.ref(this, 'parent');
    action(this, 'addChildren');
    action(this, 'removeChildren');

    makeObservable(this);

    if (config.onOpen || config.onClose) {
      let firstReactionCall = true;

      reaction(
        () => this.isOpened,
        (isOpened) => {
          if (firstReactionCall) {
            firstReactionCall = false;
            // ignore first 'onClose' callback call
            if (!isOpened) {
              return;
            }
          }

          if (isOpened) {
            config.onOpen?.(this.data!, this);
          } else {
            config.onClose?.();
          }
        },
        {
          signal: this.abortController.signal,
          fireImmediately: true,
        },
      );
    }
  }

  protected get baseUrl() {
    const baseUrl = this.config.baseUrl ?? routeConfig.get().baseUrl;
    return baseUrl?.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }

  protected get data(): RouteMatchesData<TPath> | null {
    let pathnameToCheck: string;

    if (this.isHash) {
      pathnameToCheck = this.history.location.hash.slice(1);
    } else {
      pathnameToCheck = this.history.location.pathname;
    }

    if (this.baseUrl) {
      if (!this.history.location.pathname.startsWith(this.baseUrl)) {
        return null;
      }

      pathnameToCheck = pathnameToCheck.replace(this.baseUrl, '');
    }

    if (
      (this.path === '' || this.path === '/') &&
      (pathnameToCheck === '/' || pathnameToCheck === '')
    ) {
      return { params: {} as any, path: pathnameToCheck };
    }

    const matcher = this._matcher ?? (this._matcher = match(this.tokenData));
    const parsed = matcher(pathnameToCheck);

    if (parsed === false) {
      return null;
    }

    return parsed as RouteMatchesData<TPath>;
  }

  /**
   * Matched path segment for current URL.
   *
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#currentpath-parsedpathname-null)
   */
  get currentPath(): string | null {
    return this.data?.path ?? null;
  }

  /**
   * Current parsed path parameters.
   *
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#params-parsedpathparams-null)
   */
  get params(): ParsedPathParams<TPath> | null {
    return this.data?.params ?? null;
  }

  /**
   * Defines the "open" state for this route.
   *
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#isopened-boolean)
   */
  get isOpened() {
    if (this.data === null) {
      return false;
    }

    return !this.config.checkOpened || this.config.checkOpened(this.data);
  }

  /**
   * Allows to create child route based on this route with merging this route path and extending path.
   *
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#extend-path-config-route)
   */
  extend<TExtendPath extends string>(
    path: TExtendPath,
    config?: Omit<RouteConfiguration<any>, 'parent'>,
  ) {
    type ExtendedRoutePath = `${TPath}${TExtendPath}`;
    type ParentRoute = this;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { index, ...configFromCurrentRoute } = this.config;

    const extendedChild = new Route<ExtendedRoutePath, ParentRoute>(
      `${this.path}${path}`,
      {
        ...configFromCurrentRoute,
        ...config,
        parent: this,
      } as any,
    );

    this.addChildren(extendedChild);

    return extendedChild;
  }

  addChildren(...routes: AnyRoute[]) {
    this.children.push(...routes);
  }

  removeChildren(...routes: AnyRoute[]) {
    this.children = this.children.filter((child) => !routes.includes(child));
  }

  /**
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#hasopenedchildren-boolean)
   */
  get hasOpenedChildren(): boolean {
    return this.children.some(
      (child) => child.isOpened || child.hasOpenedChildren,
    );
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
      this.isHash ? '#' : '',
      path,
      buildSearchString(queryParams || {}),
    ].join('');
  }

  /**
   * Navigates to this route.
   *
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#open-args)
   */
  open(
    ...args: AllPropertiesOptional<ExtractPathParams<TPath>> extends true
      ? [
          params?: ExtractPathParams<TPath> | null | undefined,
          navigateParams?: RouteNavigateParams,
        ]
      : [params: ExtractPathParams<TPath>, navigateParams?: RouteNavigateParams]
  ): void | Promise<void>;
  open(
    ...args: AllPropertiesOptional<ExtractPathParams<TPath>> extends true
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
  ): void | Promise<void>;
  open(url: string, navigateParams?: RouteNavigateParams): void | Promise<void>;
  open(
    url: string,
    replace?: RouteNavigateParams['replace'],
    query?: RouteNavigateParams['query'],
  ): void | Promise<void>;

  /**
   * Navigates to this route.
   *
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#open-args)
   */
  open(...args: any[]) {
    let {
      replace,
      state: rawState,
      query,
    } = typeof args[1] === 'boolean' || args.length > 2
      ? { replace: args[1], query: args[2] }
      : (args[1] ?? {});
    let url: string;
    let params: Maybe<ExtractPathParams<TPath>>;

    if (typeof args[0] === 'string') {
      url = args[0];
    } else {
      params = args[0] as ExtractPathParams<TPath>;
      url = this.createUrl(args[0], query);
    }

    let state = rawState ?? null;

    const openData: OpenData = {
      url,
      params: params as AnyObject,
      replace,
      state,
      query,
    };

    const beforeOpenResult = this.beforeOpen(openData);

    if (beforeOpenResult && beforeOpenResult instanceof Promise) {
      return beforeOpenResult.then((beforeOpenCheck) =>
        this.applyOpen(openData, beforeOpenCheck),
      );
    } else {
      this.applyOpen(openData, beforeOpenResult);
    }
  }

  protected beforeOpen(
    openData: OpenData,
  ): BeforeOpenCheckResult | Promise<BeforeOpenCheckResult> {
    if (this.config.beforeOpen) {
      return this.config.beforeOpen(openData);
    }

    return true;
  }

  private applyOpen(
    beforeOpenData: OpenData,
    beforeOpenCheckResult: BeforeOpenCheckResult,
  ) {
    let url = beforeOpenData.url;
    let replace = beforeOpenData.replace;
    let state = beforeOpenData.state;

    if (beforeOpenCheckResult === false) {
      return;
    }

    if (typeof beforeOpenCheckResult === 'object') {
      url = beforeOpenCheckResult.url;
      replace = beforeOpenCheckResult.replace ?? beforeOpenData.replace;
      state = beforeOpenCheckResult.state ?? beforeOpenData.state;
    }

    if (replace) {
      this.history.replace(url, state);
    } else {
      this.history.push(url, state);
    }
  }

  protected get tokenData() {
    if (!this._tokenData) {
      this._tokenData = parse(this.path, this.config.parseOptions);
    }
    return this._tokenData;
  }

  destroy() {
    this.abortController.abort();
  }
}

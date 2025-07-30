/* eslint-disable prefer-const */
import { LinkedAbortController } from 'linked-abort-controller';
import {
  action,
  computed,
  makeObservable,
  observable,
  onBecomeObserved,
  onBecomeUnobserved,
  reaction,
} from 'mobx';
import {
  buildSearchString,
  History,
  IQueryParams,
} from 'mobx-location-history';
import { compile, match, ParamData, parse, TokenData } from 'path-to-regexp';
import { IsPartial, AnyObject, Maybe, MaybePromise } from 'yummies/utils/types';

import { routeConfig } from '../config/config.js';

import {
  AnyRoute,
  BeforeOpenFeedback,
  PreparedNavigationData,
  InputPathParams,
  RouteConfiguration,
  ParsedPathData,
  RouteNavigateParams,
  IRoute,
  ParsedPathParams,
} from './route.types.js';

/**
 * Class for creating path based route.
 *
 * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html)
 */
export class Route<
  TPath extends string,
  TInputParams extends InputPathParams<TPath> = InputPathParams<TPath>,
  TOutputParams extends AnyObject = ParsedPathParams<TPath>,
  TParentRoute extends Route<any, any, any, any> | null = null,
> implements IRoute<TPath, TInputParams, TOutputParams>
{
  protected abortController: AbortController;
  protected history: History;
  parent: TParentRoute;

  query: IQueryParams;

  private _tokenData: TokenData | undefined;
  private _matcher?: ReturnType<typeof match>;
  private _compiler?: ReturnType<typeof compile>;
  private reactionDisposer: Maybe<VoidFunction>;

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
    protected config: RouteConfiguration<
      TPath,
      TInputParams,
      TOutputParams,
      TParentRoute
    > = {},
  ) {
    this.abortController = new LinkedAbortController(config.abortSignal);
    this.history = config.history ?? routeConfig.get().history;
    this.query = config.queryParams ?? routeConfig.get().queryParams;
    this.isIndex = !!this.config.index;
    this.isHash = !!this.config.hash;
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

    onBecomeObserved(this, 'isOpened', () => {
      if (!config.afterOpen && !config.afterClose) {
        return;
      }

      this.reactionDisposer = reaction(
        () => this.isOpened,
        this.processOpenedState,
        {
          signal: this.abortController.signal,
          fireImmediately: true,
        },
      );
    });
    onBecomeUnobserved(this, 'isOpened', () => {
      this.reactionDisposer?.();
      this.reactionDisposer = undefined;
    });
  }

  protected get baseUrl() {
    const baseUrl = this.config.baseUrl ?? routeConfig.get().baseUrl;
    return baseUrl?.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }

  protected get parsedPathData(): ParsedPathData<TPath> | null {
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

    return parsed as ParsedPathData<TPath>;
  }

  /**
   * Matched path segment for current URL.
   *
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#currentpath-parsedpathname-null)
   */
  get currentPath(): string | null {
    return this.parsedPathData?.path ?? null;
  }

  /**
   * Current parsed path parameters.
   *
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#params-parsedpathparams-null)
   */
  get params(): TOutputParams | null {
    if (!this.parsedPathData?.params) {
      return null;
    }

    let params: TOutputParams | null =
      (this.parsedPathData?.params as unknown as Maybe<TOutputParams>) ?? null;

    if (this.config.params) {
      const result = this.config.params(this.parsedPathData.params);
      if (result) {
        params = result;
      } else {
        return null;
      }
    }

    return params;
  }

  /**
   * Defines the "open" state for this route.
   *
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#isopened-boolean)
   */
  get isOpened() {
    if (this.params === null || this.parsedPathData === null) {
      return false;
    }

    return (
      !this.config.checkOpened || this.config.checkOpened(this.parsedPathData)
    );
  }

  /**
   * Allows to create child route based on this route with merging this route path and extending path.
   *
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#extend-path-config-route)
   */
  extend<
    TExtendPath extends string,
    TInputParams extends
      InputPathParams<`${TPath}${TExtendPath}`> = InputPathParams<`${TPath}${TExtendPath}`>,
    TOutputParams extends
      AnyObject = ParsedPathParams<`${TPath}${TExtendPath}`>,
  >(
    path: TExtendPath,
    config?: Omit<
      RouteConfiguration<
        `${TPath}${TExtendPath}`,
        TInputParams,
        TOutputParams,
        any
      >,
      'parent'
    >,
  ) {
    type ExtendedRoutePath = `${TPath}${TExtendPath}`;
    type ParentRoute = this;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { index, params, ...configFromCurrentRoute } = this.config;

    const extendedChild = new Route<
      ExtendedRoutePath,
      TInputParams,
      TOutputParams,
      ParentRoute
    >(`${this.path}${path}`, {
      ...configFromCurrentRoute,
      ...config,
      parent: this,
    } as any);

    this.addChildren(extendedChild as any);

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
    params?: TInputParams | null | undefined,
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
    ...args: IsPartial<TInputParams> extends true
      ? [params?: Maybe<TInputParams>, query?: AnyObject]
      : [params: TInputParams, query?: AnyObject]
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

  /**
   * Navigates to this route.
   *
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#open-args)
   */
  async open(...args: any[]) {
    let {
      replace,
      state: rawState,
      query,
    } = typeof args[1] === 'boolean' || args.length > 2
      ? { replace: args[1], query: args[2] }
      : (args[1] ?? {});
    let url: string;
    let params: Maybe<InputPathParams<TPath>>;

    if (typeof args[0] === 'string') {
      url = args[0];
    } else {
      params = args[0] as InputPathParams<TPath>;
      url = this.createUrl(args[0], query);
    }

    let state = rawState ?? null;

    const navigationData: PreparedNavigationData<TInputParams> = {
      url,
      params: params as TInputParams,
      replace,
      state,
      query,
    };

    const feedback = await this.beforeOpen(navigationData);

    if (feedback === false) {
      return;
    }

    if (typeof feedback === 'object') {
      Object.assign(navigationData, feedback);
    }

    if (replace) {
      this.history.replace(url, state);
    } else {
      this.history.push(url, state);
    }

    if (!this.reactionDisposer && this.isOpened) {
      this.config.afterOpen?.(this.parsedPathData!, this);
    }
  }

  protected beforeOpen(
    openData: PreparedNavigationData<TInputParams>,
  ): MaybePromise<BeforeOpenFeedback> {
    if (this.config.beforeOpen) {
      return this.config.beforeOpen(openData);
    }

    return true;
  }

  protected afterClose() {
    if (this.config.afterClose) {
      return this.config.afterClose();
    }

    return true;
  }

  protected get tokenData() {
    if (!this._tokenData) {
      this._tokenData = parse(this.path, this.config.parseOptions);
    }
    return this._tokenData;
  }

  private firstOpenedStateCheck = true;
  private processOpenedState = (isOpened: boolean) => {
    if (this.firstOpenedStateCheck) {
      this.firstOpenedStateCheck = false;
      // ignore first 'afterClose' callback call
      if (!isOpened) {
        return;
      }
    }

    if (isOpened) {
      this.config.afterOpen?.(this.parsedPathData!, this);
    } else {
      this.config.afterClose?.();
    }
  };

  destroy() {
    this.abortController.abort();
  }
}

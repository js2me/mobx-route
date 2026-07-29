import { comparer, computed, observable, reaction, runInAction } from 'mobx';
import {
  buildSearchString,
  type History,
  type IQueryParams,
} from 'mobx-location-history';
import {
  compile,
  match,
  type ParamData,
  parse,
  type TokenData,
} from 'path-to-regexp';
import { applyObservable, type ObservableAnnotationsArray } from 'yummies/mobx';
import type { AnyObject, IsPartial, Maybe } from 'yummies/types';
import { routeConfig } from '../config/index.js';
import type {
  AnyRoute,
  CreatedUrlOutputParams,
  InputPathParams,
  NavigationTrx,
  ParsedPathData,
  ParsedPathParams,
  RouteConfiguration,
  RouteNavigateParams,
  UrlCreateParams,
} from './route.types.js';

declare const process: { env: { NODE_ENV?: string } };

const annotations: ObservableAnnotationsArray<Route<any, any, any, any>> = [
  [
    computed,
    'isPathMatched',
    'isOpened',
    'isOpening',
    'path',
    'absolutePath',
    'hasOpenedChildren',
    'isAbleToMergeQuery',
    'baseUrl',
  ],
  [computed.struct, 'parsedPathData', 'params'],
  [observable, 'children'],
  [observable.ref, 'parent', 'status'],
];

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
> {
  private isDestroyed?: boolean;
  private disposer?: VoidFunction;

  protected history: History;

  /**
   * Parent route.
   *
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#parent)
   */
  parent: TParentRoute;

  query: IQueryParams;

  private _tokenData: TokenData | undefined;
  private _matcher?: ReturnType<typeof match>;
  private _compiler?: ReturnType<typeof compile>;
  private ignoreOpenByPathMatch = false;
  private isUpdate = false;
  private updateDisposer?: VoidFunction;

  protected status:
    | 'opening'
    | 'closed'
    | 'open-rejected'
    | 'open-confirmed'
    | 'unknown';

  meta?: AnyObject;

  /**
   * Route path pattern declaration.
   *
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#pathdeclaration)
   */
  pathDeclaration: TPath;

  /**
   * Indicates if this route is an index route. Index routes activate when parent route path matches exactly.
   *
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#isindex)
   */
  isIndex: boolean;

  /**
   * Indicates if this route is an hash route.
   *
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#ishash)
   */
  isHash: boolean;

  /**
   * Array of child routes.
   *
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#children)
   */
  children: AnyRoute[] = [];

  constructor(
    pathDeclaration: TPath,
    protected config: RouteConfiguration<
      TPath,
      TInputParams,
      TOutputParams,
      TParentRoute
    > = {},
  ) {
    this.history = config.history ?? routeConfig.get().history;
    this.query = config.queryParams ?? routeConfig.get().queryParams;
    this.pathDeclaration = pathDeclaration;
    this.isIndex = !!this.config.index;
    this.isHash = !!this.config.hash;
    this.meta = this.config.meta;
    this.status = 'unknown';
    this.parent = config.parent ?? (null as unknown as TParentRoute);

    applyObservable(this, annotations);

    if (this.config.abortSignal?.aborted) {
      this.isDestroyed = true;
    } else {
      this.disposer = reaction(() => this.isPathMatched, this.checkPathMatch, {
        fireImmediately: true,
      });
      this.updateDisposer = reaction(
        () => {
          if (this.status !== 'open-confirmed') return undefined;
          return [this.parsedPathData, this.query.data] as const;
        },
        (value, prevValue) => {
          if (prevValue === undefined) return;
          if (value === undefined) return;
          if (!this.parsedPathData) return;
          this.config.afterUpdate?.(this.parsedPathData, this);
        },
        {
          fireImmediately: false,
          signal: this.config.abortSignal,
          equals: comparer.structural,
        },
      );
      this.config.abortSignal?.addEventListener('abort', () => this.destroy(), {
        once: true,
      });
    }
  }

  protected get baseUrl() {
    const baseUrl = this.config.baseUrl ?? routeConfig.get().baseUrl;
    return baseUrl?.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }

  /**
   * Checks whether current route matches provided path.
   *
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#matchpath)
   */
  matchPath(path?: Maybe<string>): ParsedPathData<TPath> | null {
    let pathnameToCheck: string;

    if (path != null) {
      pathnameToCheck = path;
    } else if (this.isHash) {
      pathnameToCheck = this.history.location.hash.slice(1);
    } else {
      pathnameToCheck = this.history.location.pathname;
    }

    if (this.baseUrl) {
      if (!pathnameToCheck.startsWith(this.baseUrl)) {
        return null;
      }

      pathnameToCheck = pathnameToCheck.replace(this.baseUrl, '');
    }

    if (
      (this.pathDeclaration === '' || this.pathDeclaration === '/') &&
      (pathnameToCheck === '/' || pathnameToCheck === '')
    ) {
      return { params: {} as any, path: pathnameToCheck };
    }

    this._matcher ??= match(this.tokenData, {
      end: this.config.exact ?? false,
      ...this.config.matchOptions,
    });
    const parsed = this._matcher(pathnameToCheck);

    if (parsed === false) {
      return null;
    }

    return parsed as ParsedPathData<TPath>;
  }

  protected get parsedPathData(): ParsedPathData<TPath> | null {
    return this.matchPath();
  }

  /**
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#isopening)
   *
   * Also true in the short gap after history already matches this route but
   * `confirmOpening` has not started yet (e.g. browser Back) — otherwise every
   * route looks closed for one tick and RouteViewGroup unmounts the page.
   */
  get isOpening() {
    if (this.status === 'opening') {
      return true;
    }

    if (
      this.isDestroyed ||
      !this.isPathMatched ||
      this.params === null ||
      this.status === 'open-confirmed' ||
      this.status === 'open-rejected'
    ) {
      return false;
    }

    return this.status === 'closed' || this.status === 'unknown';
  }

  /**
   * Matched path segment for current URL.
   *
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#path)
   */
  get path(): string | null {
    return this.parsedPathData?.path ?? null;
  }

  /**
   * Matched path segment for current URL with base URL.
   *
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#absolutepath)
   */
  get absolutePath(): string | null {
    const path = this.path;

    if (path === null) {
      return null;
    }

    return `${this.baseUrl || ''}${path}`;
  }

  /**
   * Current parsed path parameters.
   *
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#params)
   */
  get params(): TOutputParams | null {
    if (!this.parsedPathData?.params) {
      return null;
    }

    let params: TOutputParams | null =
      (this.parsedPathData?.params as unknown as Maybe<TOutputParams>) ?? null;

    if (this.config.params) {
      const result = this.config.params(
        this.parsedPathData.params,
        this.config.meta,
      );
      if (result) {
        params = result;
      } else {
        return null;
      }
    }

    return params;
  }

  protected get isPathMatched() {
    return this.parsedPathData !== null;
  }

  /**
   * Defines the "open" state for this route.
   *
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#isopened)
   */
  get isOpened() {
    if (
      this.isDestroyed ||
      !this.isPathMatched ||
      this.params === null ||
      this.status !== 'open-confirmed'
    ) {
      return false;
    }

    return (
      // this.parsedPathData is defined because this.params !== null
      !this.config.checkOpened || this.config.checkOpened(this.parsedPathData!)
    );
  }

  /**
   * Allows to create child route based on this route with merging this route path and extending path.
   *
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#extend)
   */
  extend<
    TExtendedPath extends string,
    TExtendedInputParams extends
      InputPathParams<`${TPath}${TExtendedPath}`> = InputPathParams<`${TPath}${TExtendedPath}`>,
    TExtendedOutputParams extends AnyObject = TInputParams &
      ParsedPathParams<`${TPath}${TExtendedPath}`>,
  >(
    pathDeclaration: TExtendedPath,
    config?: Omit<
      RouteConfiguration<
        `${TPath}${TExtendedPath}`,
        TInputParams & TExtendedInputParams,
        TExtendedOutputParams,
        any
      >,
      'parent'
    >,
  ) {
    type ExtendedRoutePath = `${TPath}${TExtendedPath}`;
    type ParentRoute = this;
    const { index, params, exact, ...configFromCurrentRoute } = this.config;

    const extendedChild = new Route<
      ExtendedRoutePath,
      TInputParams & TExtendedInputParams,
      TExtendedOutputParams,
      ParentRoute
    >(`${this.pathDeclaration}${pathDeclaration}`, {
      ...configFromCurrentRoute,
      ...config,
      parent: this,
    } as any);

    this.addChildren(extendedChild as any);

    return extendedChild;
  }

  /**
   * Manually add child routes.
   *
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#addchildren)
   */
  addChildren(...routes: AnyRoute[]) {
    this.children.push(...routes);
  }

  /**
   * Remove specified routes from children.
   *
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#removechildren)
   */
  removeChildren(...routes: AnyRoute[]) {
    this.children = this.children.filter((child) => !routes.includes(child));
  }

  /**
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#hasopenedchildren)
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

  /**
   * Generates full route URL.
   *
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#createurl)
   */
  createUrl(
    ...args: IsPartial<TInputParams> extends true
      ? [
          params?: Maybe<TInputParams>,
          query?: Maybe<AnyObject>,
          mergeQueryOrParams?: boolean | CreatedUrlOutputParams,
        ]
      : [
          params: TInputParams,
          query?: Maybe<AnyObject>,
          mergeQueryOrParams?: boolean | CreatedUrlOutputParams,
        ]
  ) {
    const params = args[0];
    const rawQuery = args[1];
    const mergeQueryOrOutputParams = args[2] ?? this.isAbleToMergeQuery;
    const outputParams: Maybe<CreatedUrlOutputParams> =
      typeof mergeQueryOrOutputParams === 'boolean'
        ? { mergeQuery: mergeQueryOrOutputParams }
        : mergeQueryOrOutputParams;

    const query = outputParams?.mergeQuery
      ? { ...this.query.data, ...rawQuery }
      : (rawQuery ?? {});

    this._compiler ??= compile(this.tokenData);

    const defaultUrlCreateParams: UrlCreateParams<TInputParams> = {
      baseUrl: this.baseUrl,
      params: params as TInputParams,
      query,
    };
    const urlCreateParams: UrlCreateParams<TInputParams> =
      this.config.createUrl?.(defaultUrlCreateParams, this.query.data) ??
      routeConfig.get().createUrl?.(defaultUrlCreateParams, this.query.data) ??
      defaultUrlCreateParams;

    let path: string;

    try {
      path = this._compiler(this.processParams(urlCreateParams.params));
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') {
        console.error(
          'Error #1: Route path compilation failed\n' +
            'The path pattern could not be built into a URL (often missing or invalid params for a `:param` segment). Using fallbackPath or "/".\n' +
            'See docs: https://js2me.github.io/mobx-route/errors/1',
          e,
        );
      } else {
        console.error('minified error #1;see mobx-route docs', e);
      }
      path = this.config.fallbackPath ?? routeConfig.get().fallbackPath ?? '/';
    }

    const url = `${urlCreateParams.baseUrl || ''}${this.isHash ? '#' : ''}${path}`;

    if (outputParams?.omitQuery) {
      return url;
    }

    return `${url}${buildSearchString(urlCreateParams.query)}`;
  }

  /**
   * Navigates to this route.
   *
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#open)
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
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#open)
   */
  async open(...args: any[]) {
    const {
      replace,
      state: rawState,
      query: rawQuery,
      mergeQuery: rawMergeQuery,
    } = typeof args[1] === 'boolean' || args.length > 2
      ? ({ replace: args[1], query: args[2] } as RouteNavigateParams)
      : ((args[1] ?? {}) as RouteNavigateParams);
    let url: string;
    let params: Maybe<InputPathParams<TPath>>;

    const mergeQuery = rawMergeQuery ?? this.isAbleToMergeQuery;
    const query = mergeQuery ? { ...this.query.data, ...rawQuery } : rawQuery;

    if (typeof args[0] === 'string') {
      url = args[0];
    } else {
      params = args[0] as InputPathParams<TPath>;
      url = this.createUrl(args[0], query);
    }

    const state = rawState ?? null;

    const trx: NavigationTrx<TInputParams> = {
      url,
      params: params as TInputParams,
      replace,
      state,
      query,
    };

    this.isUpdate = this.status === 'open-confirmed';
    this.ignoreOpenByPathMatch = true;
    const isConfirmed = await this.confirmOpening(trx);

    if (isConfirmed !== true) {
      this.ignoreOpenByPathMatch = false;
      this.isUpdate = false;
    }
  }

  /**
   * Updates the current route if it is already open.
   * Unlike `open`, this is a no-op if the route is not open,
   * defaults to `replace: true` instead of push,
   * and defaults to `mergeQuery: true` when no query params are provided.
   *
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#update)
   */
  update(
    ...args: IsPartial<TInputParams> extends true
      ? [
          params?: TInputParams | null | undefined,
          navigateParams?: RouteNavigateParams,
        ]
      : [params: TInputParams, navigateParams?: RouteNavigateParams]
  ): Promise<void>;
  update(
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
  update(url: string, navigateParams?: RouteNavigateParams): Promise<void>;
  update(
    url: string,
    replace?: RouteNavigateParams['replace'],
    query?: RouteNavigateParams['query'],
  ): Promise<void>;

  /**
   * Updates the current route if it is already open.
   * Unlike `open`, this is a no-op if the route is not open,
   * defaults to `replace: true` instead of push,
   * and defaults to `mergeQuery: true` when no query params are provided.
   *
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#update)
   */
  async update(...args: any[]) {
    if (this.status !== 'open-confirmed') {
      return;
    }

    // Default replace to true for update method
    // Default mergeQuery to true when no query params are provided
    const isObjectNavigateParams =
      args.length > 1 && typeof args[1] === 'object' && args[1] !== null;
    const isPositionalReplace = args.length > 1 && typeof args[1] === 'boolean';

    if (isObjectNavigateParams) {
      const hasQuery = 'query' in (args[1] as object);
      args[1] = {
        replace: true,
        ...(hasQuery ? {} : { mergeQuery: true }),
        ...args[1],
      };
    } else if (isPositionalReplace) {
      // User explicitly passed boolean replace -- leave as-is
      // If no query provided positionally, default mergeQuery: true
      const hasPositionalQuery = args.length > 2 && args[2] !== undefined;
      if (!hasPositionalQuery) {
        args[1] = { replace: args[1], mergeQuery: true };
        args.length = 2;
      }
    } else if (args.length === 1) {
      // Only params/url provided, no second arg -- add default replace and mergeQuery
      args[1] = { replace: true, mergeQuery: true };
    }

    return (this.open as (...args: any[]) => Promise<void>)(...args);
  }

  protected get tokenData() {
    if (!this._tokenData) {
      this._tokenData = parse(this.pathDeclaration, this.config.parseOptions);
    }
    return this._tokenData;
  }

  protected async confirmOpening(trx: NavigationTrx<TInputParams>) {
    if (!this.isUpdate) {
      runInAction(() => {
        this.status = 'opening';
      });
    }

    let skipHistoryUpdate = !!trx.preferSkipHistoryUpdate;

    if (skipHistoryUpdate) {
      this.ignoreOpenByPathMatch = false;
    }

    if (this.config.beforeOpen) {
      const feedback = await this.config.beforeOpen(trx);

      if (feedback === false) {
        runInAction(() => {
          this.status = 'open-rejected';
        });

        return;
      }

      // Rebuild URL from updated trx.params if beforeOpen changed them
      // This ensures that mutations to trx.params are reflected in the URL
      const newUrl = this.createUrl(
        trx.params as TInputParams,
        trx.query as AnyObject,
      );
      if (newUrl !== trx.url) {
        trx.url = newUrl;
        skipHistoryUpdate = false;
      }

      if (typeof feedback === 'object') {
        skipHistoryUpdate = false;
        Object.assign(trx, feedback);
      }
    }

    if (this.isDestroyed) {
      return;
    }

    if (!skipHistoryUpdate) {
      if (trx.replace) {
        this.history.replace(trx.url, trx.state);
      } else {
        this.history.push(trx.url, trx.state);
      }
    }

    if (this.isPathMatched) {
      const wasAlreadyConfirmed = this.status === 'open-confirmed';
      runInAction(() => {
        this.status = 'open-confirmed';
      });

      if (this.isUpdate) {
        this.isUpdate = false;
        // afterUpdate is handled by the updateDisposer reaction which
        // watches parsedPathData and query.data changes while open-confirmed
      } else if (!wasAlreadyConfirmed) {
        this.config.afterOpen?.(this.parsedPathData!, this);
      }
    }

    return true;
  }

  protected confirmClosing() {
    runInAction(() => {
      this.status = 'closed';
    });
    return true;
  }

  private firstPathMatchingRun = true;

  private checkPathMatch = async (isPathMathched: boolean) => {
    if (this.firstPathMatchingRun) {
      this.firstPathMatchingRun = false;
      // ignore first 'afterClose' callback call
      if (!isPathMathched) {
        return;
      }
    }

    if (isPathMathched) {
      // after manual open call
      if (this.ignoreOpenByPathMatch) {
        this.ignoreOpenByPathMatch = false;
        if (this.status === 'opening' && this.parsedPathData) {
          runInAction(() => {
            this.status = 'open-confirmed';
          });
          if (this.isUpdate) {
            this.isUpdate = false;
            this.config.afterUpdate?.(this.parsedPathData, this);
          } else {
            this.config.afterOpen?.(this.parsedPathData, this);
          }
        }
        // For updates (status is already 'open-confirmed'), confirmOpening
        // handles the rest — no need to do anything here.
        return;
      }

      // Sync before any await — closes the Back gap where isOpened/isOpening
      // were both false until confirmOpening's first runInAction ran.
      if (this.status !== 'opening' && this.status !== 'open-confirmed') {
        runInAction(() => {
          this.status = 'opening';
        });
      }

      // Already open-confirmed via confirmOpening — no need to re-confirm
      if (this.status === 'open-confirmed') {
        return;
      }

      const trx: NavigationTrx<TInputParams> = {
        url: `${this.parsedPathData!.path}${buildSearchString(this.query.data)}`,
        params: this.parsedPathData!.params as TInputParams,
        state: this.history.location.state,
        query: this.query.data,
        preferSkipHistoryUpdate: true,
      };

      await this.confirmOpening(trx);
    } else {
      this.ignoreOpenByPathMatch = false;

      const isConfirmed = this.confirmClosing();

      if (isConfirmed) {
        this.config.afterClose?.();
      }
    }
  };

  private get isAbleToMergeQuery() {
    return this.config.mergeQuery ?? routeConfig.get().mergeQuery;
  }

  /**
   * Destroys route subscriptions and reactions.
   *
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#destroy)
   */
  destroy() {
    this.isDestroyed = true;
    this.disposer?.();
    this.disposer = undefined;
    this.updateDisposer?.();
    this.updateDisposer = undefined;
  }
}

export const createRoute = <
  TPath extends string,
  TInputParams extends InputPathParams<TPath> = InputPathParams<TPath>,
  TOutputParams extends AnyObject = ParsedPathParams<TPath>,
  TParentRoute extends Route<any, any, any, any> | null = null,
>(
  path: TPath,
  config?: RouteConfiguration<TPath, TInputParams, TOutputParams, TParentRoute>,
) => new Route<TPath, TInputParams, TOutputParams, TParentRoute>(path, config);

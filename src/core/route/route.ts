import { LinkedAbortController } from 'linked-abort-controller';
import { computed, observable, reaction, runInAction } from 'mobx';
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
  IRoute,
  NavigationTrx,
  ParsedPathData,
  ParsedPathParams,
  RouteConfiguration,
  RouteNavigateParams,
  UrlCreateParams,
} from './route.types.js';

const annotations: ObservableAnnotationsArray<Route<any, any, any, any>> = [
  [
    computed,
    'isPathMatched',
    'isOpened',
    'isOpening',
    'path',
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
> implements IRoute<TPath, TInputParams, TOutputParams>
{
  protected abortController: AbortController;
  protected history: History;
  parent: TParentRoute;

  query: IQueryParams;

  private _tokenData: TokenData | undefined;
  private _matcher?: ReturnType<typeof match>;
  private _compiler?: ReturnType<typeof compile>;
  private ignoreOpenByPathMatch = false;

  protected status:
    | 'opening'
    | 'closed'
    | 'open-rejected'
    | 'open-confirmed'
    | 'unknown';

  meta?: AnyObject;

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
    public pathDeclaration: TPath,
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
    this.meta = this.config.meta;
    this.status = 'unknown';
    this.parent = config.parent ?? (null as unknown as TParentRoute);

    applyObservable(this, annotations);

    reaction(() => this.isPathMatched, this.checkPathMatch, {
      signal: this.abortController.signal,
      fireImmediately: true,
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

  get isOpening() {
    return this.status === 'opening';
  }

  /**
   * Matched path segment for current URL.
   *
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#path-parsedpathname-null)
   */
  get path(): string | null {
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
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#isopened-boolean)
   */
  get isOpened() {
    if (
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
   * [**Documentation**](https://js2me.github.io/mobx-route/core/Route.html#extend-path-config-route)
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
    // biome-ignore lint/correctness/noUnusedVariables: this is need to extract unused fields
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
      console.error('Error while compiling route path', e);
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

    if (await this.confirmOpening(trx)) {
      this.ignoreOpenByPathMatch = true;
    }
  }

  protected get tokenData() {
    if (!this._tokenData) {
      this._tokenData = parse(this.pathDeclaration, this.config.parseOptions);
    }
    return this._tokenData;
  }

  protected async confirmOpening(trx: NavigationTrx<TInputParams>) {
    runInAction(() => {
      this.status = 'opening';
    });

    let skipHistoryUpdate = !!trx.preferSkipHistoryUpdate;

    if (this.config.beforeOpen) {
      const feedback = await this.config.beforeOpen(trx);

      if (feedback === false) {
        runInAction(() => {
          this.status = 'open-rejected';
        });
      }

      if (typeof feedback === 'object') {
        skipHistoryUpdate = false;
        Object.assign(trx, feedback);
      }
    }

    if (this.abortController.signal.aborted) {
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
      runInAction(() => {
        this.status = 'open-confirmed';
      });

      this.config.afterOpen?.(this.parsedPathData!, this);
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
        return;
      }

      const trx: NavigationTrx<TInputParams> = {
        url: this.parsedPathData!.path,
        params: this.parsedPathData!.params as TInputParams,
        state: this.history.location.state,
        query: this.query.data,
        preferSkipHistoryUpdate: true,
      };

      await this.confirmOpening(trx);
    } else {
      const isConfirmed = this.confirmClosing();

      if (isConfirmed) {
        this.config.afterClose?.();
      }
    }
  };

  private get isAbleToMergeQuery() {
    return this.config.mergeQuery ?? routeConfig.get().mergeQuery;
  }

  destroy() {
    this.abortController.abort();
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

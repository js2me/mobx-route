import { computed, makeObservable } from 'mobx';
import {
  IMobxHistory,
  IMobxLocation,
  MobxHistory,
  MobxLocation,
} from 'mobx-location-history';
import { compile, match, ParamData, parse, TokenData } from 'path-to-regexp';
import { AllPropertiesOptional } from 'yummies/utils/types';

import {
  AnyRoute,
  ExtractPathParams,
  RouteConfiguration,
  RouteGlobalConfiguration,
  RouteMatchesData,
  RouteNavigateParams,
} from './route.types.js';

export class Route<
  TPath extends string,
  TParentRoute extends AnyRoute | null = null,
> {
  history: IMobxHistory;
  location: IMobxLocation;

  private _tokenData: TokenData | undefined;

  constructor(
    public path: TPath,
    protected configuration: RouteConfiguration<TParentRoute> = {},
  ) {
    this.history = configuration.history ?? Route.globalConfiguration.history;
    this.location =
      configuration.location ?? Route.globalConfiguration.location;

    computed.struct(this, 'isMatches');
    computed.struct(this, 'matchData');

    makeObservable(this);
  }

  get matchData(): RouteMatchesData<TPath> | null {
    const parsed = match(this.tokenData)(this.location.pathname);

    if (parsed === false) {
      return null;
    }

    return parsed as RouteMatchesData<TPath>;
  }

  get isMatches() {
    return this.matchData !== null;
  }

  extend<TExtendedPath extends string>(path: TExtendedPath) {
    return new Route<`${TPath}${TExtendedPath}`, this>(
      `${this.path}${path}`,
      this.configuration as any,
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

  navigate(
    ...args: AllPropertiesOptional<ExtractPathParams<TPath>> extends true
      ? [
          params?: ExtractPathParams<TPath> | null | undefined,
          navigateParams?: RouteNavigateParams,
        ]
      : [params: ExtractPathParams<TPath>, navigateParams?: RouteNavigateParams]
  ) {
    const path = compile(this.tokenData)(this.processParams(args[0]));
    if (args[1]?.replace) {
      this.history.replaceState(null, '', path);
    } else {
      this.history.pushState(null, '', path);
    }
  }

  protected get tokenData() {
    if (!this._tokenData) {
      this._tokenData = parse(this.path, this.configuration.parseOptions);
    }
    return this._tokenData;
  }

  private static _globalConfiguration: RouteGlobalConfiguration | undefined;

  static setGlobalConfiguration(globalConfiguration: RouteGlobalConfiguration) {
    this._globalConfiguration = globalConfiguration;
  }

  static get globalConfiguration() {
    if (!this._globalConfiguration) {
      const history = new MobxHistory();
      const location = new MobxLocation(history);

      this.setGlobalConfiguration({
        location,
        history,
      });
    }

    return this._globalConfiguration!;
  }
}

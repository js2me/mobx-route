import { computed } from 'mobx';
import type { IQueryParams } from 'mobx-location-history';
import {
  applyObservable,
  type ViewModel,
  ViewModelBase,
} from 'mobx-view-model';
import type { ObservableAnnotationsArray } from 'yummies/mobx';
import type { Class } from 'yummies/types';
import {
  type AnyAbstractRouteEntity,
  type RouteParams,
  routeConfig,
} from '../core/index.js';

const annotations: ObservableAnnotationsArray<any> = [
  [computed.struct, 'pathParams'],
  [computed, 'query'],
];

/**
 * Public interface added by `withRouteViewModel` mixin.
 */
type RouteViewModelMixinPublic<TRoute extends AnyAbstractRouteEntity> = {
  readonly route: TRoute;
  _lastPayload: RouteParams<TRoute>;
  payload: RouteParams<TRoute>;
  query: IQueryParams;
  pathParams: RouteParams<TRoute>;
  isMounted: boolean;
};

/**
 * Mixin function that enhances any `ViewModelBase` subclass with route-related properties.
 *
 * [**Documentation**](https://js2me.github.io/mobx-route/view-model/RouteViewModel)
 *
 * @param route - Route entity to bind to the view model.
 * @returns A class enhancer that takes a base class and returns a new class with route properties.
 *
 * @example
 * ```ts
 * // With ViewModelBase directly
 * class MyVM extends withRoute(someRoute)(ViewModelBase) {}
 *
 * // With a custom base class
 * class ProductPageVM extends withRoute(productRoute)(AppVM) {}
 * ```
 */
export function withRoute<TRoute extends AnyAbstractRouteEntity>(
  route: TRoute,
) {
  return <TBase extends Class<ViewModel<any, any>>>(
    Base: TBase,
  ): TBase & Class<InstanceType<TBase> & RouteViewModelMixinPublic<TRoute>> => {
    class RouteViewModelMixin extends Base {
      /**
       * Route entity bound to this view model.
       *
       * [**Documentation**](https://js2me.github.io/mobx-route/view-model/RouteViewModel#route)
       */
      readonly route: TRoute = route;

      /**
       * Caches the latest known route params.
       */
      _lastPayload: RouteParams<TRoute> = {} as RouteParams<TRoute>;

      constructor(...args: any[]) {
        super(...args);

        applyObservable(this, annotations, this.vmConfig.observable.viewModels);
      }

      /**
       * Current route params with fallback to the last cached value.
       */
      override get payload(): RouteParams<TRoute> {
        if ('params' in this.route && this.route.params != null) {
          this._lastPayload = this.route.params as RouteParams<TRoute>;
        }

        return this._lastPayload;
      }

      /**
       * Current query params from route or global route config.
       *
       * [**Documentation**](https://js2me.github.io/mobx-route/view-model/RouteViewModel#query)
       */
      get query(): IQueryParams {
        if ('query' in this.route) {
          return this.route.query as IQueryParams;
        }

        return routeConfig.get().queryParams;
      }

      /**
       * Alias for `payload`.
       *
       * [**Documentation**](https://js2me.github.io/mobx-route/view-model/RouteViewModel#pathparams)
       */
      get pathParams() {
        return this.payload;
      }

      /**
       * Mounted state including the route opened status.
       */
      override get isMounted() {
        return super.isMounted && this.route.isOpened;
      }
    }

    return RouteViewModelMixin as any;
  };
}

/**
 * Base class created by the mixin with a dummy route.
 * Used internally by `RouteViewModel` to avoid duplicating the mixin logic.
 */
const _RouteViewModelBase = withRoute({} as any)(ViewModelBase);

/**
 * Abstract route-aware view model that extends `ViewModelBase<EmptyObject>`.
 *
 * Provides `route`, `payload`, `pathParams`, `query`, and `isMounted` properties.
 * Subclasses must declare `route = someRoute`.
 *
 * [**Documentation**](https://js2me.github.io/mobx-route/view-model/RouteViewModel)
 *
 * @example
 * ```ts
 * class MyVM extends RouteViewModel<typeof myRoute> {
 *   route = myRoute;
 * }
 * ```
 */
export abstract class RouteViewModel<
  TRoute extends AnyAbstractRouteEntity = AnyAbstractRouteEntity,
> extends _RouteViewModelBase {
  abstract override readonly route: TRoute;
}

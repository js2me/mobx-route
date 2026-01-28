import { computed, reaction, when } from 'mobx';
import {
  type AnyAbstractRouteEntity,
  type IQueryParams,
  type RouteParams,
  routeConfig,
} from 'mobx-route';
import {
  applyObservable,
  ViewModelBase,
  type ViewModelParams,
} from 'mobx-view-model';
import type { ObservableAnnotationsArray } from 'yummies/mobx';
import type { EmptyObject } from 'yummies/types';

const annotations: ObservableAnnotationsArray<RouteViewModel<any>> = [
  [computed.struct, 'pathParams'],
  [computed, 'query'],
];

export abstract class RouteViewModel<
  TRoute extends AnyAbstractRouteEntity = AnyAbstractRouteEntity,
> extends ViewModelBase<EmptyObject> {
  abstract readonly route: TRoute;

  constructor(params: ViewModelParams<EmptyObject, any>) {
    super(params);

    applyObservable(this, annotations, this.vmConfig.observable.viewModels);

    when(
      () => this.isMounted,
      () => {
        reaction(
          () => this.route.isOpened,
          (isOpened) => {
            if (!isOpened && this.isMounted) {
              this.unmount();
            }
          },
          { fireImmediately: true, signal: this.unmountSignal },
        );
      },
      { signal: this.unmountSignal },
    );
  }

  override get payload(): RouteParams<TRoute> {
    if ('params' in this.route) {
      return this.route.params || ({} as any);
    }

    return {} as EmptyObject as any;
  }

  get query(): IQueryParams {
    if ('query' in this.route) {
      return this.route.query as IQueryParams;
    }

    return routeConfig.get().queryParams;
  }

  get pathParams() {
    return this.payload;
  }

  get isMounted() {
    return super.isMounted && this.route.isOpened;
  }
}

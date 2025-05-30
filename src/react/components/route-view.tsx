import { observer } from 'mobx-react-lite';
import { ComponentType, ReactNode, useRef } from 'react';
import { loadable } from 'react-simple-loadable';

import type {
  AnyRoute,
  AnyRouteEntity,
  AnyVirtualRoute,
} from '../../core/index.js';

export type RouteViewComponent<TRouteEntity extends AnyRouteEntity> =
  ComponentType<RouteViewProps<TRouteEntity>>;

export interface RouteViewConfigProps<TRouteEntity extends AnyRouteEntity> {
  route: TRouteEntity;
  view?: RouteViewComponent<TRouteEntity>;
  lazyView?: () => Promise<ComponentType<RouteViewProps<TRouteEntity>>>;
  loader?: ComponentType;
  fallbackView?: ReactNode;
  children?: ReactNode;
}

export type RouteViewProps<TRouteEntity extends AnyRouteEntity> = {
  children?: ReactNode;
  params: TRouteEntity extends AnyRoute
    ? Exclude<TRouteEntity['params'], null | undefined>
    : TRouteEntity extends AnyVirtualRoute
      ? TRouteEntity['params']
      : never;
};

function RouteViewBase<TRouteEntity extends AnyRouteEntity>(
  props: RouteViewConfigProps<TRouteEntity>,
) {
  const lazyViewComponentRef = useRef<ComponentType<any>>();

  let Component: ComponentType<any> | undefined;

  if (!props.route.isOpened) {
    return props.fallbackView ?? null;
  }

  if (props.lazyView) {
    lazyViewComponentRef.current = loadable(props.lazyView, {
      loader: props.loader,
    });
    Component = lazyViewComponentRef.current;
  } else {
    Component = props.view;
  }

  const params = 'params' in props.route ? props.route.params : {};

  return Component ? (
    <Component params={params}>{props.children}</Component>
  ) : (
    props.children
  );
}

export const RouteView = observer(RouteViewBase);

import { observer } from 'mobx-react-lite';
import { ComponentType, ReactNode, useRef } from 'react';
import { loadable } from 'react-simple-loadable';

import type { AnyRouteEntity } from '../../core/index.js';

export interface RouteViewProps<TRouteEntity extends AnyRouteEntity> {
  route: TRouteEntity;
  view?: ComponentType<{ children?: ReactNode }>;
  lazyView?: () => Promise<ComponentType<{ children?: ReactNode }>>;
  loader?: ComponentType;
  notOpenedContent?: ReactNode;
  children?: ReactNode;
}

function RouteViewBase<TRouteEntity extends AnyRouteEntity>(
  props: RouteViewProps<TRouteEntity>,
) {
  const lazyViewComponentRef = useRef<ComponentType<any>>();

  let Component: ComponentType<any> | undefined;

  if (!props.route.isOpened) {
    return props.notOpenedContent ?? null;
  }

  if (props.lazyView) {
    lazyViewComponentRef.current = loadable(props.lazyView, {
      loader: props.loader,
    });
    Component = lazyViewComponentRef.current;
  } else {
    Component = props.view;
  }

  return Component && <Component>{props.children}</Component>;
}

export const RouteView = observer(RouteViewBase);

import { observer } from 'mobx-react-lite';
import { ComponentType, useRef } from 'react';
import { loadable } from 'react-simple-loadable';

import { AnyRouteGroup } from '../route/route-group.types.js';
import { AnyRoute } from '../route/route.types.js';
import type { VirtualRoute } from '../route/virtual-route.js';

type RouteKind = AnyRouteGroup | AnyRoute | VirtualRoute;

export interface RouteViewProps<TRouteKind extends RouteKind> {
  route: TRouteKind;
  view?: ComponentType<any>;
  lazyView?: () => Promise<ComponentType<any>>;
  loader?: ComponentType;
}

function RouteViewBase<TRouteKind extends RouteKind>(
  props: RouteViewProps<TRouteKind>,
) {
  const lazyViewComponentRef = useRef<ComponentType<any>>();

  let Component: ComponentType<any> | undefined;

  if (!props.route.isOpened) {
    return null;
  }

  if (props.lazyView) {
    lazyViewComponentRef.current = loadable(props.lazyView, {
      loader: props.loader,
    });
    Component = lazyViewComponentRef.current;
  } else {
    Component = props.view;
  }

  return Component && <Component />;
}

export const RouteView = observer(RouteViewBase);

import type { AnyAbstractRouteEntity } from 'mobx-route';
import { createContext, useContext } from 'solid-js';

interface RouteViewGroupRegistry {
  registerRoute: (route: AnyAbstractRouteEntity) => void;
  unregisterRoute: (route: AnyAbstractRouteEntity) => void;
}

export const RouteViewGroupContext = createContext<RouteViewGroupRegistry>();

export function useRouteViewGroup() {
  return useContext(RouteViewGroupContext);
}

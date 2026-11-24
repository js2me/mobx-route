import type { AnyAbstractRouteEntity } from 'mobx-route';
import { type Accessor, createContext, useContext } from 'solid-js';

interface RouteViewGroupRegistry {
  registerRoute: (
    route: Accessor<AnyAbstractRouteEntity | undefined>,
  ) => () => void;
  /** Returns the currently active route entity (or null) */
  activeRoute: Accessor<AnyAbstractRouteEntity | null>;
  /** Whether there is an active child route */
  hasActiveChild: Accessor<boolean>;
  /** Whether useLastOpened is enabled */
  useLastOpened: Accessor<boolean>;
  /** Whether the group should render null (string otherwise with no active child) */
  shouldRenderNull: Accessor<boolean>;
}

export const RouteViewGroupContext = createContext<RouteViewGroupRegistry>();

export function useRouteViewGroup() {
  return useContext(RouteViewGroupContext);
}

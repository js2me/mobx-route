/** biome-ignore-all lint/nursery/noFloatingPromises: test assertions are intentionally floating */

import { act, render, screen } from '@testing-library/react';
import { observable, when } from 'mobx';
import { createBrowserHistory } from 'mobx-location-history';
import { ViewModelBase } from 'mobx-view-model';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRoute, routeConfig } from './core/index.js';
import { mockHistory } from './core/route/route.test.js';
import { createVirtualRoute } from './core/virtual-route/virtual-route.js';
import { Link } from './react/components/link.js';
import { RouteView } from './react/components/route-view.js';
import { RouteViewGroup } from './react/components/route-view-group.js';
import { RouteViewModel, withRoute } from './view-model/route-view-model.js';

describe('README scenarios', () => {
  const history = mockHistory(createBrowserHistory());

  beforeAll(() => {
    routeConfig.update({ history });
  });

  beforeEach(() => {
    history.replace('/', null);
    globalThis.history.replaceState(null, '', '/');
    window.history.replaceState(null, '', '/');
    history.resetMock();
  });

  describe('Quick Start', () => {
    it('should open route and reflect isOpened and params', async () => {
      const userDetails = createRoute('/users/:id');

      // Path params are required — TypeScript enforces it
      await userDetails.open({ id: 1 });

      expect(userDetails.isOpened).toBe(true);
      expect(userDetails.params).toEqual({ id: '1' });
    });
  });

  describe('🔗 Nested Routes with .extend()', () => {
    it('should build route trees with extend and auto-concatenate paths', async () => {
      const users = createRoute('/users');
      const userDetails = users.extend('/:userId');
      const userPhotos = userDetails.extend('/photos');

      // Path is auto-concatenated: /users/:userId/photos
      await userPhotos.open({ userId: 42 });
      // → /users/42/photos

      expect(userPhotos.isOpened).toBe(true);
      expect(userPhotos.params).toEqual({ userId: '42' });

      expect(users.isOpened).toBe(true); // parent is open too
      expect(users.hasOpenedChildren).toBe(true);
    });
  });

  describe('🛡️ Route Guards & Redirects', () => {
    it('should redirect via beforeOpen when not authenticated', async () => {
      const isAuthenticated = vi.fn().mockResolvedValue(false);

      const dashboard = createRoute('/dashboard', {
        beforeOpen: async () => {
          if (!(await isAuthenticated())) {
            return { url: '/login', replace: true }; // redirect
          }
          // return undefined → proceed
        },
      });

      const loginRoute = createRoute('/login');

      await dashboard.open();

      expect(dashboard.isOpened).toBe(false);
      expect(loginRoute.isOpened).toBe(true);
    });

    it('should proceed when beforeOpen returns undefined', async () => {
      const isAuthenticated = vi.fn().mockResolvedValue(true);

      const dashboard = createRoute('/dashboard', {
        beforeOpen: async () => {
          if (!(await isAuthenticated())) {
            return { url: '/login', replace: true };
          }
        },
      });

      await dashboard.open();

      expect(dashboard.isOpened).toBe(true);
    });

    it('should use checkOpened as a predicate for route openness', async () => {
      const route = createRoute('/dashboard/:id', {
        checkOpened: (parsedData) => parsedData.params.id === '123',
      });

      // URL matches but checkOpened returns false
      history.push('/dashboard/456');
      expect(route.isOpened).toBe(false);

      // URL matches and checkOpened returns true
      history.push('/dashboard/123');
      expect(route.isOpened).toBe(true);
    });
  });

  describe('🔮 Virtual Routes for Modals & Drawers', () => {
    it('should open/close virtual route and track isOpened', async () => {
      const authModal = createVirtualRoute({
        checkOpened: (route) => route.query.data.modal === 'auth',
        open: (_, route) => route.query.update({ modal: 'auth' }),
        close: (route) => route.query.update({ modal: undefined }),
      });

      // Initially closed
      expect(authModal.isOpened).toBe(false);

      // Open the modal
      await authModal.open();

      expect(authModal.isOpened).toBe(true);

      // Close the modal
      await authModal.close();

      expect(authModal.isOpened).toBe(false);
    });

    it('should prevent closing with beforeClose', async () => {
      const hasUnsavedChanges = observable.box(true);

      const authModal = createVirtualRoute({
        beforeClose: () => !hasUnsavedChanges.get(), // prevent closing
      });

      await authModal.open();

      // Cannot close while unsaved changes exist
      await authModal.close();
      expect(authModal.isOpened).toBe(true);

      // Resolve unsaved changes — now can close
      hasUnsavedChanges.set(false);
      await authModal.close();
      expect(authModal.isOpened).toBe(false);
    });
  });

  describe('🎯 Typed Query Params', () => {
    it('should open route with typed query params', async () => {
      const search = createRoute<
        '/search',
        {},
        {},
        { q: string; page?: number; sort?: 'asc' | 'desc' }
      >('/search');

      await search.open({}, { query: { q: 'mobx', page: 1 } });

      expect(search.isOpened).toBe(true);
      expect(search.query.data.q).toBe('mobx');
      // query.data is Record<string, string> — page comes as string from URL
      expect(search.query.data.page).toBe('1');
    });
  });

  describe('🔄 update() for In-Place Changes', () => {
    it('should replace params without polluting browser history', async () => {
      const userRoute = createRoute('/users/:userId');

      await userRoute.open({ userId: 1 }, { query: { tab: 'profile' } });
      expect(userRoute.params).toEqual({ userId: '1' });
      expect(userRoute.query.data.tab).toBe('profile');

      // update() defaults to replace: true, mergeQuery: true
      await userRoute.update({ userId: 2 });
      expect(userRoute.params).toEqual({ userId: '2' });
      // query is preserved due to mergeQuery: true
      expect(userRoute.query.data.tab).toBe('profile');
    });
  });

  describe('🧩 React Integration', () => {
    it('RouteView should render view when route is open', async () => {
      const userRoute = createRoute('/users/:id');

      const UserPage = ({ params }: { params: any }) => (
        <div>{`User ${params.id}`}</div>
      );

      await userRoute.open({ id: 42 });

      render(<RouteView route={userRoute} view={UserPage} />);

      expect(screen.getByText('User 42')).toBeDefined();
    });

    it('RouteView should render fallback when route is closed', () => {
      const userRoute = createRoute('/users/:id');

      render(
        <RouteView
          route={userRoute}
          view={() => <div>Page</div>}
          fallback={<div>Loading</div>}
        />,
      );

      expect(screen.getByText('Loading')).toBeDefined();
    });

    it('RouteViewGroup should switch between routes', async () => {
      const homeRoute = createRoute('/home');
      const userRoute = createRoute('/users/:id');

      const HomePage = () => <div>Home</div>;
      const UserPage = ({ params }: { params: any }) => (
        <div>{`User ${params.id}`}</div>
      );

      await homeRoute.open();

      render(
        <RouteViewGroup>
          <RouteView route={homeRoute} view={HomePage} />
          <RouteView route={userRoute} view={UserPage} />
        </RouteViewGroup>,
      );

      expect(screen.getByText('Home')).toBeDefined();

      await act(async () => {
        await userRoute.open({ id: 1 });
      });

      expect(screen.getByText('User 1')).toBeDefined();
    });

    it('Link should render with correct href for route with params', async () => {
      const userRoute = createRoute('/users/:userId');

      render(
        <Link to={userRoute} params={{ userId: 42 }}>
          Profile
        </Link>,
      );

      expect(screen.getByText('Profile')).toBeDefined();
      // The link should have the correct href
      const link = screen.getByText('Profile');
      expect(link.closest('a')?.getAttribute('href')).toContain('/users/42');
    });
  });

  describe('🧠 View Model Integration', () => {
    it('RouteViewModel should provide route, payload, pathParams, query, isMounted', async () => {
      const userRoute = createRoute('/users/:id');

      class UserPageVM extends RouteViewModel<typeof userRoute> {
        route = userRoute as any;
      }

      const vm = new UserPageVM({} as any);

      await userRoute.open({ id: 5 });

      (vm as any).mount();
      await when(() => vm.isMounted);

      expect(vm.isMounted).toBe(true);
      expect(vm.pathParams).toEqual({ id: '5' });
    });

    it('withRoute mixin should provide route properties', async () => {
      const userRoute = createRoute('/users/:id');

      class UserPageVM extends withRoute(userRoute)(ViewModelBase) {}

      const vm = new UserPageVM({} as any);

      await userRoute.open({ id: 10 });

      (vm as any).mount();
      await when(() => vm.isMounted);

      expect(vm.isMounted).toBe(true);
      expect(vm.pathParams).toEqual({ id: '10' });
    });
  });

  describe('🌍 Optional Path Segments & Wildcards', () => {
    it('should handle optional path segments', async () => {
      const route = createRoute('/users{/:tab}');

      // Open without optional segment → /users
      await route.open();
      expect(route.isOpened).toBe(true);
      expect(route.path).toBe('/users');

      // Open with optional segment → /users/1
      await route.open({ tab: 1 });
      expect(route.isOpened).toBe(true);
      expect(route.path).toBe('/users/1');
    });

    it('should handle wildcard/rest params', async () => {
      const docs = createRoute('/docs/*rest');

      await docs.open({ rest: ['api', 'v2', 'auth'] });
      expect(docs.isOpened).toBe(true);
      expect(docs.path).toBe('/docs/api/v2/auth');
    });
  });

  describe('📦 Tree-Shakeable Subpath Exports', () => {
    it('should import createRoute from mobx-route core', async () => {
      // Verifies the core import works
      const route = createRoute('/test-export');
      await route.open();
      expect(route.isOpened).toBe(true);
    });

    it('should import RouteView and Link from mobx-route/react', () => {
      // Verifies the React subpath import works
      expect(RouteView).toBeDefined();
      expect(Link).toBeDefined();
    });

    it('should import RouteViewModel from mobx-route/view-model', () => {
      // Verifies the view-model subpath import works
      expect(RouteViewModel).toBeDefined();
      expect(withRoute).toBeDefined();
    });
  });
});

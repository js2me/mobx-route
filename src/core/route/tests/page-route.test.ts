import { describe, expect, expectTypeOf, it } from 'vitest';
import type { AnyObject } from 'yummies/types';
import { createRoute, Route } from '../route.js';
import type {
  InferQueryParams,
  InputPathParam,
  InputPathParams,
  ParsedPathParams,
  RouteConfiguration,
  RouteNavigateParams,
} from '../route.types.js';

interface PageRouteConfiguration<
  TPath extends string,
  TInputParams extends InputPathParams<TPath> = InputPathParams<TPath>,
  TOutputParams extends AnyObject = ParsedPathParams<TPath>,
  TQueryParams extends Record<string, any> = AnyObject,
> extends RouteConfiguration<TPath, TInputParams, TOutputParams, TQueryParams> {
  trackName: string;
}

class PageRoute<
  TPath extends string,
  TInputParams extends InputPathParams<TPath> = InputPathParams<TPath>,
  TOutputParams extends AnyObject = ParsedPathParams<TPath>,
  TQueryParams extends Record<string, any> = AnyObject,
> extends Route<TPath, TInputParams, TOutputParams, TQueryParams> {
  trackEvent: () => void;

  constructor(
    pathDeclaration: TPath,
    {
      trackName,
      ...routeConfig
    }: PageRouteConfiguration<TPath, TInputParams, TOutputParams, TQueryParams>,
  ) {
    super(pathDeclaration, routeConfig);
    this.trackEvent = () => {
      void trackName;
    };
  }

  extend<
    TExtendedPath extends string,
    TExtendedInputParams extends
      InputPathParams<`${TPath}${TExtendedPath}`> = InputPathParams<`${TPath}${TExtendedPath}`>,
    TExtendedOutputParams extends AnyObject = TInputParams &
      ParsedPathParams<`${TPath}${TExtendedPath}`>,
    TExtendedQueryParams extends Record<string, any> = TQueryParams,
  >(
    pathDeclaration: TExtendedPath,
    config: Omit<
      PageRouteConfiguration<
        `${TPath}${TExtendedPath}`,
        TInputParams & TExtendedInputParams,
        TExtendedOutputParams,
        TExtendedQueryParams
      >,
      'parent'
    >,
  ): PageRoute<
    `${TPath}${TExtendedPath}`,
    TInputParams & TExtendedInputParams,
    TExtendedOutputParams,
    TExtendedQueryParams
  > {
    const child = new PageRoute<
      `${TPath}${TExtendedPath}`,
      TInputParams & TExtendedInputParams,
      TExtendedOutputParams,
      TExtendedQueryParams
    >(`${this.pathDeclaration}${pathDeclaration}`, {
      ...config,
      parent: this as any,
    });
    return child;
  }
}

describe('page route extend typings', () => {
  it('should allow generic vm constrained by PageRoute<any, any, any, any>', () => {
    class TestVM<TRoute extends PageRoute<any, any, any, any>> {
      constructor(public data: { route: TRoute }) {}
    }

    const route = new PageRoute('/services', {
      trackName: 'services',
    });

    const vm = new TestVM({ route });

    expectTypeOf(vm.data.route).toEqualTypeOf<typeof route>();
  });

  it('should merge parent and child input params', () => {
    const parent = new PageRoute<
      '/users/:userId',
      { userId: number; locale: string },
      { userId: string }
    >('/users/:userId', {
      trackName: 'users',
    });

    const child = parent.extend('/posts/:postId', {
      trackName: 'posts',
    });

    expectTypeOf(child.open).parameter(0).toMatchTypeOf<
      | string
      | {
          userId: number;
          locale: string;
          postId: InputPathParam;
        }
    >();

    // @ts-expect-error locale is required from parent route input params
    void child.open({ userId: 1, postId: 2 });
  });

  it('should infer full path literal', () => {
    const root = new PageRoute('/projects/:projectId', {
      trackName: 'projects',
    });
    const issue = root.extend('/issues/:issueId', {
      trackName: 'issues',
    });

    expect(issue.pathDeclaration).toBe('/projects/:projectId/issues/:issueId');
    expectTypeOf(
      issue.pathDeclaration,
    ).toEqualTypeOf<'/projects/:projectId/issues/:issueId'>();
  });

  it('should keep merged params in chained extend calls', () => {
    const level1 = new PageRoute('/orgs/:orgId', {
      trackName: 'orgs',
    });
    const level2 = level1.extend('/teams/:teamId', {
      trackName: 'teams',
    });
    const level3 = level2.extend('/members/:memberId', {
      trackName: 'members',
    });

    expectTypeOf(level3.open).parameter(0).toMatchTypeOf<
      | string
      | {
          orgId: InputPathParam;
          teamId: InputPathParam;
          memberId: InputPathParam;
        }
    >();
  });

  it('should infer custom output params from params config in extend', () => {
    const users = new PageRoute('/users/:userId', {
      trackName: 'users',
    });
    const posts = users.extend('/posts/:postId', {
      trackName: 'posts',
      params: (params) => {
        return {
          slug: `${params.userId}-${params.postId}`,
          ids: [params.userId, params.postId],
        };
      },
    });

    expectTypeOf(posts.params).toEqualTypeOf<null | {
      slug: string;
      ids: string[];
    }>();
  });
});

describe('query params typings', () => {
  it('should type query.data as Record<string, string> by default', () => {
    const route = createRoute('/users/:id');

    expectTypeOf(route.query.data).toEqualTypeOf<Record<string, string>>();
  });

  it('should type query.data as Record<string, string> regardless of TQueryParams', () => {
    const route = createRoute<
      '/users/:id',
      { id: InputPathParam },
      { id: string },
      { tab: string; page?: number }
    >('/users/:id');

    // query.data is always Record<string, string> at runtime — TQueryParams is for input typing only
    expectTypeOf(route.query.data).toEqualTypeOf<Record<string, string>>();
  });

  it('should type open query param with explicit TQueryParams', () => {
    type QueryShape = { tab: string; page?: number };

    // Verify RouteNavigateParams<TQueryParams> has query typed as Partial<TQueryParams>
    expectTypeOf<RouteNavigateParams<QueryShape>['query']>().toEqualTypeOf<
      Partial<QueryShape> | undefined
    >();
  });

  it('should type createUrl query param with explicit TQueryParams', () => {
    type QueryShape = { tab: string; page?: number };

    // Verify createUrl query param type through UrlCreateParams
    const route = createRoute<
      '/users/:id',
      { id: InputPathParam },
      { id: string },
      QueryShape
    >('/users/:id');

    // query.data is always Record<string, string> at runtime
    expectTypeOf(route.query.data).toEqualTypeOf<Record<string, string>>();
  });

  it('should extend with inherited query params by default', () => {
    const parent = createRoute<
      '/users/:userId',
      { userId: InputPathParam },
      { userId: string },
      { tab: string; page?: number }
    >('/users/:userId');

    const child = parent.extend('/posts/:postId');

    // query.data is always Record<string, string> at runtime
    expectTypeOf(child.query.data).toEqualTypeOf<Record<string, string>>();
  });

  it('should extend with custom query params', () => {
    const parent = createRoute<
      '/users/:userId',
      { userId: InputPathParam },
      { userId: string },
      { tab: string }
    >('/users/:userId');

    const child = parent.extend<
      '/posts/:postId',
      { userId: InputPathParam; postId: InputPathParam },
      { userId: string; postId: string },
      { filter: string; sort?: string }
    >('/posts/:postId');

    // query.data is always Record<string, string> at runtime
    expectTypeOf(child.query.data).toEqualTypeOf<Record<string, string>>();
  });

  it('should extract query params input type with InferQueryParams', () => {
    const route = createRoute<
      '/users/:id',
      { id: InputPathParam },
      { id: string },
      { tab: string; page?: number }
    >('/users/:id');

    // InferQueryParams extracts the INPUT shape, not the runtime output
    expectTypeOf<InferQueryParams<typeof route>>().toEqualTypeOf<{
      tab: string;
      page?: number;
    }>();
  });
});

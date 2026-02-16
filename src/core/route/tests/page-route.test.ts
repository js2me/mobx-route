import { describe, expect, expectTypeOf, it } from 'vitest';
import type { AnyObject } from 'yummies/types';
import { Route } from '../route.js';
import type {
  InputPathParam,
  InputPathParams,
  ParsedPathParams,
  RouteConfiguration,
} from '../route.types.js';

interface PageRouteConfiguration<
  TPath extends string,
  TInputParams extends InputPathParams<TPath> = InputPathParams<TPath>,
  TOutputParams extends AnyObject = ParsedPathParams<TPath>,
  TParentRoute extends Route<string, any, any, any> | null = null,
> extends RouteConfiguration<TPath, TInputParams, TOutputParams, TParentRoute> {
  trackName: string;
}

class PageRoute<
  TPath extends string,
  TInputParams extends InputPathParams<TPath> = InputPathParams<TPath>,
  TOutputParams extends AnyObject = ParsedPathParams<TPath>,
  TParentRoute extends Route<any, any, any, any> | null = null,
> extends Route<TPath, TInputParams, TOutputParams, TParentRoute> {
  trackEvent: () => void;

  constructor(
    pathDeclaration: TPath,
    {
      trackName,
      ...routeConfig
    }: PageRouteConfiguration<TPath, TInputParams, TOutputParams, TParentRoute>,
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
  >(
    pathDeclaration: TExtendedPath,
    config: Omit<
      PageRouteConfiguration<
        `${TPath}${TExtendedPath}`,
        TInputParams & TExtendedInputParams,
        TExtendedOutputParams,
        any
      >,
      'parent'
    >,
  ): PageRoute<
    `${TPath}${TExtendedPath}`,
    TInputParams & TExtendedInputParams,
    TExtendedOutputParams,
    this
  > {
    const child = new PageRoute<
      `${TPath}${TExtendedPath}`,
      TInputParams & TExtendedInputParams,
      TExtendedOutputParams,
      this
    >(`${this.pathDeclaration}${pathDeclaration}`, {
      ...config,
      parent: this,
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
    child.open({ userId: 1, postId: 2 });
  });

  it('should infer full path literal and parent route type', () => {
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
    expectTypeOf(issue.parent).toEqualTypeOf<typeof root>();
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
    expectTypeOf(level3.parent).toEqualTypeOf<typeof level2>();
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

# Route

Path-based route.  
This class binds a URL pattern to reactive `isOpened` and `params`, and exposes `open()` for navigation. URL-less variant: [`VirtualRoute`](/core/VirtualRoute).

## Usage
```ts
createRoute(
  path: TPath,
  config?: RouteConfiguration<TParentRoute>,
)
new Route( // class form
  path: TPath,
  config?: RouteConfiguration<TParentRoute>,
)
```

### Basic example

```ts{7-9}
const users = createRoute('/users');
const userDetails = users.extend('/:userId');
const userPhotos = userDetails.extend('/photos');

await userPhotos.open({ userId: 1 });

users.isOpened; // true
userDetails.isOpened; // true
userPhotos.isOpened; // true;
location.pathname; // /users/1/photos
```

### Route path   

The route path is built using the [path-to-regexp](https://www.npmjs.com/package/path-to-regexp) library.
The path itself is specified as the first parameter when creating an instance of the `Route` class.  

So you can use all power of this library with TypeScript support out-of-box   
```ts
const route = createRoute('/*segment');

route.open({
  segment: [1,2,3]
})
```

## Methods and properties  

### `open()`   

Navigates to this route.   
First argument can be required based on path declaration (first argument)  

**API Signature**  
```ts
open(params?, opts?): Promise<void>
open(params?, replace?, query?): Promise<void>
open(url: string, opts?): Promise<void>
open(url: string, replace?, query?): Promise<void>
```

`opts`: `{ query?, replace?, state?, mergeQuery? }`.

When the first argument is a string, navigation goes to that URL directly without compiling the path pattern.

More about `mergeQuery` you can read [here](/core/routeConfig#mergequery)   

Examples:  
```ts
const stars = createRoute('/stars');
await stars.open();
location.pathname; // /stars
```

```ts
const starDetails = createRoute('/stars/:starId');
await starDetails.open({ starId: 1 }, {
  query: { bar: 'baz' }
});

const starsWithMeta = createRoute('/stars{/:meta}');
await starsWithMeta.open();
await starsWithMeta.open({ meta: 1 }, {
  query: { foo: 'bar' },
});

```

### `confirmOpening()` <Badge type="warning" text="protected" />

Route opening pipeline hook that is called by `open()` and internal path-match synchronization.
Use it when you need custom side effects around route opening.

**API Signature**
```ts
protected confirmOpening(
  trx: NavigationTrx<TInputParams>,
): Promise<true | undefined>
```

`trx` is navigation transaction object:
- `url`: target URL
- `params`: input path params passed to `open(...)`
- `query`: query params for the target URL
- `state`: history state payload
- `replace`: use `history.replace` instead of `history.push`
- `preferSkipHistoryUpdate`: internal flag to skip history update

If opening is rejected (for example, by `beforeOpen`) this method can return `undefined`.
For inherited implementation, `true` means opening was confirmed.

Example:
```ts
class AnalyticsRoute<TPath extends string> extends Route<TPath> {
  protected async confirmOpening(
    trx: NavigationTrx<InputPathParams<TPath>>,
  ): Promise<true | undefined> {
    const result = await super.confirmOpening(trx);

    if (result) {
      this.trackEvent('Opened');
    }

    return result;
  }

  private trackEvent(name: string) {
    console.log(name);
  }
}
```

### `confirmClosing()` <Badge type="warning" text="protected" />

Route closing pipeline hook that is called when route path no longer matches current location.
Use it to execute custom logic before `afterClose` is triggered.

**API Signature**
```ts
protected confirmClosing(): boolean | undefined
```

For inherited implementation, returning truthy value confirms close and allows `afterClose` callback.
Returning `false` or `undefined` can be used to skip close confirmation side effects.

Example:
```ts
class AnalyticsRoute<TPath extends string> extends Route<TPath> {
  protected confirmClosing(): boolean | undefined {
    const result = super.confirmClosing();

    if (result) {
      this.trackEvent('Closed');
    }

    return result;
  }

  private trackEvent(name: string) {
    console.log(name);
  }
}
```

### `extend()`  
Creates a child route by appending a path to this one's pattern.

::: info Extending route from parent will ignore parameters:
 `index`, `params` `exact`
:::

Example:
```ts
const stars = createRoute('/stars');
const starDetails = stars.extend('/:starId');
starDetails.pathDeclaration; // '/stars/:starId'
await starDetails.open({ starId: 1 });
location.pathname; // /stars/1
starDetails.path; // '/stars/1'
```

### `query`

Query params (`IQueryParams` from [`mobx-location-history`](https://js2me.github.io/mobx-location-history)). Override per route via `queryParams` in config.

```ts
const route = createRoute('/search');
route.query.update({ q: 'mobx' });
route.query.data; // { q: 'mobx' }
```

### `isIndex`  
Indicates if this route is an index route. Set via `{ index: true }` in config.  
Useful with [`groupRoutes`](/core/groupRoutes).

### `isHash`  
Indicates if this route is a hash-based route. Set via `{ hash: true }` in config.  
Matches `location.hash` (without `#`). Use with [`createHashHistory`](/recipes/hash-routing).  

### `isOpened` <Badge type="tip" text="computed" />   

Defines the "open" state for this route.   
Returns true when current URL matches this route's path pattern and the open lifecycle has been confirmed (i.e. `beforeOpen`/`params` checks passed).

Example:  
```ts
const stars = createRoute('/stars');
await stars.open();
stars.isOpened; // true
```

::: tip Always `await open()` if you check `isOpened` afterwards
With an async `beforeOpen` or `params()` the route sits in `isOpening` first. Reading `isOpened` without `await` is only safe when no async gates are configured.
:::

### `isOpening` <Badge type="tip" text="computed" />   
`true` while an `open()` call is in flight (before `beforeOpen`/`params` resolve).

### `params`  <Badge type="tip" text="computed.struct" />  
Current parsed path parameters. `null` if route isn't open.  

Example:  
```ts
const routeA = createRoute('/foo/bar/:baz');
location.href = '/foo/bar/1234';
routeA.params; // { baz: "1234" }
```

### `parent` <Badge type="info" text="observable.ref" />  
Parent route  

Example:  
```ts
const routeA = createRoute('/a');
const routeB = routeA.extend('/b');

routeB.parent === routeA; // true
```

### `path` <Badge type="tip" text="computed" />   
Matched path segment for current URL. `null` if route isn't open.  

Example:  
```ts
const routeA = createRoute('/foo/bar/:baz');
location.href = '/foo/bar/1234';
routeA.path; // '/foo/bar/1234'
```


### `absolutePath` <Badge type="tip" text="computed" />   
Matched path segment for current URL with base URL. `null` if route isn't open.  

Example:  
```ts
const routeA = createRoute('/foo/bar/:baz', { baseUrl: '/app' });
location.href = '/app/foo/bar/1234';
routeA.absolutePath; // '/app/foo/bar/1234'
```

### `pathDeclaration`  
Original pattern passed to `createRoute(...)`. For the currently matched URL segment use [`path`](#path) / [`absolutePath`](#absolutepath).

Example:  
```ts
const routeA = createRoute('/foo/bar/:baz');
location.href = '/foo/bar/1234';
routeA.pathDeclaration; // '/foo/bar/:baz'
routeA.path; // '/foo/bar/1234'
```

### `hasOpenedChildren` <Badge type="tip" text="computed" />   
`true` when any child route is currently opened.  

Example:   
```ts
const routeA = createRoute('/a');
const routeB = routeA.extend('/b');
const routeC = routeB.extend('/c');

await routeC.open();
// location.pathname === '/a/b/c'

// All three match — default `exact: false` lets parents match too:
routeA.isOpened; // true
routeB.isOpened; // true
routeC.isOpened; // true

routeA.hasOpenedChildren; // true
routeB.hasOpenedChildren; // true
routeC.hasOpenedChildren; // false
```

### `children` <Badge type="info" text="observable" />   
Array of child routes. Automatically updated when using `extend()`.  

### `createUrl()`  
Generates full URL for route. Respects base URL and parent routes.  

Third argument can be a boolean (same as `mergeQuery`) or object `CreatedUrlOutputParams`:

- **`mergeQuery`** — when `true`, current query params from location are merged with the passed `query`. See [routeConfig#mergeQuery](/core/routeConfig#mergequery).
- **`omitQuery`** — when `true`, the generated URL has no search string; only the path (and hash if applicable) is returned.

Example:   
```ts
const starDetails = createRoute('/stars/:starId');
starDetails.createUrl({ starId: 1 }, { bar: 1 }); // /stars/1?bar=1

starDetails.createUrl({ starId: 1 }, { baz: 2 }, true); // /stars/1?bar=1&baz=2

// path only, no query
starDetails.createUrl({ starId: 1 }, { bar: 1 }, { omitQuery: true }); // /stars/1
```

More about `mergeQuery` you can read [here](/core/routeConfig#mergequery)   

If compiling the path throws, the URL falls back to `fallbackPath` or `'/'` — see [Error #1](/errors/1).

### `matchPath()`
Checks whether provided path (or current location path) matches the route declaration.
Returns parsed path data with `params` and matched `path`, or `null` if there is no match.

**API Signature**
```ts
matchPath(path?: string | null | undefined): ParsedPathData<TPath> | null
```

When `path` is omitted:
- for hash routes (`hash: true`) it checks `location.hash` (without `#`)
- for regular routes it checks `location.pathname`

If route has `baseUrl`, `matchPath()` validates and strips it before matching.

Example:
```ts
const userRoute = createRoute('/users/:userId');

userRoute.matchPath('/users/42');
// { path: '/users/42', params: { userId: '42' } }

userRoute.matchPath('/posts/42');
// null
```

### `addChildren()` <Badge type="info" text="action" />     
Manually add child routes. Prefer `extend()` for typical use cases.  

### `removeChildren()` <Badge type="info" text="action" />     
Remove specified routes from children.  

### `destroy()`
Stops route reactions and cleans up internal subscriptions.
Call this when route instance is no longer needed.



## Configuration   
**Interface**: `RouteConfiguration`  
The second argument of `createRoute(...)` — fine-tunes matching, lifecycle, and URL building per route. Common knobs:

### `abortSignal`   
`AbortSignal` that destroys the route when fired.

### `meta`  
Arbitrary metadata attached to the route. Also passed to `params()` as its second argument.

```ts
const route = createRoute('/fruits/apples', {
  meta: {
    memes: true
  }
});

console.log(route.meta?.memes); // true
```

### `exact`   
This property changes the route matching behavior to match only exact pathname provided as the first parameter.   
This can be useful when building nested routes and you need to display sub routes within a certain parent route.

Default: `false`  

Examples:   

_`exact` is `false`_
```ts
const projectsRoute = createRoute('/projects', { exact: false });
history.push('/projects/123');
projectsRoute.isOpened; // true
```

_`exact` is `true`_
```ts
const projectsRoute = createRoute('/projects', { exact: true });
history.push('/projects/123');
projectsRoute.isOpened; // false
```

```ts
const projectsRoute = createRoute('/projects');
const projectRoute = createRoute('/projects/:projectId');

history.push('/projects/123');
projectsRoute.isOpened; // true
projectRoute.isOpened; // true
```

### `index`  
Marks route as index. Sets `isIndex` to `true`. Used by [`groupRoutes`](/core/groupRoutes).

### `hash`  
Marks route as hash-based. Sets `isHash` to `true`. Requires [`createHashHistory`](/recipes/hash-routing).

### `mergeQuery`  
Per-route override for global [`mergeQuery`](/core/routeConfig#mergequery).

### `fallbackPath`  
Path when path compilation fails in `createUrl()`. Overrides global [`fallbackPath`](/core/routeConfig#fallbackpath).

### `history` / `queryParams` / `baseUrl`  
Per-route overrides for global [`routeConfig`](/core/routeConfig).

### `parseOptions` / `matchOptions`  
Options for [path-to-regexp](https://www.npmjs.com/package/path-to-regexp) `parse()` and `match()`.

### `params()`   
Cast or validate parsed path parameters. Receives `params` and route `meta` as the second argument.

```ts
const route = createRoute('/fruits/apples/:appleId', {
  params: (params) => {
    return {
      appleId: params.appleId,
      isIphone: params.appleId.includes('iphone')
    }
  }
});

route.open({ appleId: 'iphone' })

route.params?.isIphone; // true
```

Also it can block "opened" statement for route if you will return `false` or `null` value from this function.   

```ts
const route = createRoute('/numbers/:number', {
  params: (params) => {
    if (Number.isNaN(Number(params.number))) {
      return null
    }

    return {
      number: Number(params.number)
    }
  }
});

route.open({ number: 'string' })

route.isOpened; // false
```

### `checkOpened()`   
Extra predicate for `isOpened`. The route opens only when the URL matches **and** this returns `true`.

::: info Only runs after the path matches
:::

```ts
const route = createRoute('/numbers/:number', {
  checkOpened: ({ params }) => {
    return !Number.isNaN(Number(params.number))
  }
});

route.open({ number: 'string' })

route.isOpened; // false
```


### `beforeOpen`  
Called before the URL changes (from `open()` or path-match sync). Receives `NavigationTrx`: `url`, `params`, `query`, `state`, `replace`, `preferSkipHistoryUpdate`.  
Return `false` to cancel, or `{ url, state?, replace? }` to redirect.

```ts
const route = createRoute('/foo/bar', {
  beforeOpen: (trx) => {
    if (!auth.isAuth) {
      return false;
    }
  },
});
```

See [Protected routes](/recipes/protected-routes).

### `afterClose()`  
Called after the route closes.

### `afterOpen(data, route)`  
Called after successful open. Receives parsed path data and the route instance.

### `createUrl()`   
Ability to customize path or query params before create route url.   

Example:   
```ts
const route = createRoute('/foo/bar/baz',{
  createUrl: ({ params, query }) => {
    return {
      params,
      query: {
        ...query,
        openModal: true,
      }
    }
  }
});

route.createUrl(); // /foo/bar/baz?openModal=true
await route.open(); // /foo/bar/baz?openModal=true
```

## Errors 🚨

- [Error #1: Route path compilation failed](/errors/1) (`minified error #1` in production)

## Warnings ⚠️

- [Warning #1: `RouteGroup.open()` cannot navigate](/warnings/1) (`minified warning #1` in production) — [`groupRoutes` → `open()`](/core/groupRoutes#open)

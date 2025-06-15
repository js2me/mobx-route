# Route  

Class for creating path based route.   
Routes are self-contained entities and do not require binding to a router.   

You can track their open state using the `isOpened` property, and also "open" the route using the `open()` method.   

## Constructor   
```ts
new Route(
  path: TPath,
  config?: RouteConfiguration<TParentRoute>,
)
```

### Basic example

```ts
const users = new Route('/users');
users.open();

const userDetails = users.extend('/:userId');
userDetails.open({ userId: 1 });

const userPhotos = userDetails.extend('/photos');
userPhotos.open({ userId: 1 });

userPhotos.isOpened; // true;
location.pathname; // /users/1/photos
```

### Route path   

The route path is built using the [path-to-regexp](https://www.npmjs.com/package/path-to-regexp) library.
The path itself is specified as the first parameter when creating an instance of the `Route` class.  

So you can use all power of this library with TypeScript support out-of-box   
```ts
const route = new Route('/*segment');

route.open({
  segment: [1,2,3]
})
```


## Methods and properties  

### `open(...args)`   

Navigates to this route.   
First argument can be required based on path declaration (first argument)  

**API Signature**  
```ts
open(params?, { query?, replace?, state? }): Promise<void>
open(params?, replace?, query?): Promise<void>
```

Examples:  
```ts
const stars = new Route('/stars');
await stars.open();
location.pathname; // /stars
```

```ts
const starDetails = new Route('/stars/:starId');
await starDetails.open({ starId: 1 });

const starsWithMeta = new Route('/stars{/:meta}');
starsWithMeta();
starsWithMeta({ meta: 1 });
```

### `extend(path, config): Route`  
Allows to create child route based on this route with merging this route path and extending path.   
Example:
```ts
const stars = new Route('/stars');
const starDetails = stars.extends('/:starId');
starDetails.path; // '/stars/:starId'
await starDetails.open({ starId: 1 });
location.pathname; // /stars/1
```

### `isIndex: boolean`  
Indicates if this route is an index route. Index routes activate when parent route path matches exactly.  
Useful with groupping routes using [`RouteGroup`](/core/RouteGroup)   

### `isHash: boolean`  
Indicates if this route is an hash based route.  
Hash based routes work with only `#hashstrings` in browser address URL. This is useful when you want to create routes that only affect the hash part of the URL, such as for client-side routing or for creating routes that don't affect the server-side routing.  

### `isOpened: boolean` <Badge type="tip" text="computed.struct" />   

Defines the "open" state for this route.   
Returns true when current URL matches this route's path pattern.

Example:  
```ts
const stars = new Route('/stars');
stars.open();
stars.isOpened; // true
```


### `params: ParsedPathParams | null`  <Badge type="tip" text="computed.struct" />  
Current parsed path parameters. `null` if route isn't open.  

Example:  
```ts
const routeA = new Route('/foo/bar/:baz');
location.href = '/foo/bar/1234';
routeA.params; // { baz: "1234" }
```

### `parent: TParentRoute | null` <Badge type="info" text="observable.ref" />  
Parent route  

Example:  
```ts
const routeA = new Route('/a');
const routeB = routeA.extend('/b');

routeB.parent === routeA; // true
```

### `currentPath: ParsedPathName | null` <Badge type="tip" text="computed.struct" />   
Matched path segment for current URL. `null` if route isn't open.  

Example:  
```ts
const routeA = new Route('/foo/bar/:baz');
location.href = '/foo/bar/1234';
routeA.currentPath; // '/foo/bar/1234'
```

### `hasOpenedChildren: boolean` <Badge type="tip" text="computed.struct" />   
`true` when any child route is currently opened.  

Example:   
```ts
const routeA = new Route('/a');
const routeB = routeA.extend('/b');
const routeC = routeB.extend('/c');

history.pushState(null, '', '/a/b/c');

routeA.isOpened; // false
routeB.isOpened; // false;
routeC.isOpened; // true;

routeA.hasOpenedChildren; // true
routeB.hasOpenedChildren; // true
routeC.hasOpenedChildren; // false
```

### `children: AnyRoute[]` <Badge type="info" text="observable" />   
Array of child routes. Automatically updated when using `extend()`.  

### `createUrl(params?, query?): string`  
Generates full URL for route. Respects base URL and parent routes.  

Example:   
```ts
const starDetails = new Route('/stars/:starId');
starDetails.createUrl({ starId: 1 }, { bar: 1 }); // /stars/1?bar=1
```

### `path: string`  
Original path pattern used for route matching.  

Example:   
```ts
const starDetails = new Route('/stars/:starId');
starDetails.path; // /stars/:starId
```

### `addChildren(...routes: AnyRoute[]): void` <Badge type="info" text="action" />     
Manually add child routes. Prefer `extend()` for typical use cases.  

### `removeChildren(...routes: AnyRoute[]): void` <Badge type="info" text="action" />     
Remove specified routes from children.  


## Route configuration   
This is the second argument when creating an instance of the `Route` class.  
Required for route configuration  

**API Signature**  
```ts
new Route('/foo/bar', {
  history: History;
  queryParams: IQueryParams;
  abortSignal?: AbortSignal;
  index?: boolean;
  hash?: boolean;
  meta?: AnyObject;
  parseOptions?: ParseOptions;
  parent?: TParentRoute;
  children?: AnyRoute[];
  params?: (params: ExtractPathParams<TPath>) => TParams | null | false;
  checkOpened?: (parsedPathData: ParsedPathData<NoInfer<TPath>>) => boolean;
  beforeOpen?: BeforeEnterHandler<NoInfer<TParams>>;
  afterClose?: AfterLeaveHandler;
  onOpen?: (
    data: ParsedPathData<NoInfer<TPath>>,
    route: Route<NoInfer<TPath>, NoInfer<TParams>, NoInfer<TParentRoute>>,
  ) => void;
})
```

### `beforeOpen`  
Event handler "before opening" a route, required for various checks before the route itself is opened.   
With this handler, we can prevent the route from opening by returning `false`,  
or override the navigation to another one by returning   
```ts
{
  url: string;
  state?: any;
  replace?: boolean;
}
```

Example:   
```ts
const route = new Route('/foo/bar', {
  beforeOpen: () => {
    if (!auth.isAuth) {
      return false;
    }
  }
})
```

### `checkOpened`   
Allows additional check of route state "`isOpened`".   

::: info
This check will only be called AFTER if this route is valid by `pathname`
:::

Example:   
```ts
const route = new Route('/foo/bar', {
  checkOpened: () => {
    if (auth.isAuth) {
      return true;
    }

    return false;
  }
})
```

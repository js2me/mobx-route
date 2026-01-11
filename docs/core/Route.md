# Route  

Class for creating path based route.   
Routes are self-contained entities and do not require binding to a router.   

You can track their open state using the `isOpened` property, and also "open" the route using the `open()` method.   

## Constructor   
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

### `open(...args)`   

Navigates to this route.   
First argument can be required based on path declaration (first argument)  

**API Signature**  
```ts
open(params?, { query?, replace?, state?, mergeQuery? }): Promise<void>
open(params?, replace?, query?): Promise<void>
```

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

### `extend(path, config): Route`  
Allows to create child route based on this route with merging this route path and extending path.   

::: info Extending route from parent will ignore parameters:
 `index`, `params` `exact`
:::

Example:
```ts
const stars = createRoute('/stars');
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

### `isOpened: boolean` <Badge type="tip" text="computed" />   

Defines the "open" state for this route.   
Returns true when current URL matches this route's path pattern.

Example:  
```ts
const stars = createRoute('/stars');
stars.open();
stars.isOpened; // true
```


### `params: ParsedPathParams | null`  <Badge type="tip" text="computed.struct" />  
Current parsed path parameters. `null` if route isn't open.  

Example:  
```ts
const routeA = createRoute('/foo/bar/:baz');
location.href = '/foo/bar/1234';
routeA.params; // { baz: "1234" }
```

### `parent: TParentRoute | null` <Badge type="info" text="observable.ref" />  
Parent route  

Example:  
```ts
const routeA = createRoute('/a');
const routeB = routeA.extend('/b');

routeB.parent === routeA; // true
```

### `path: ParsedPathName | null` <Badge type="tip" text="computed" />   
Matched path segment for current URL. `null` if route isn't open.  

Example:  
```ts
const routeA = createRoute('/foo/bar/:baz');
location.href = '/foo/bar/1234';
routeA.path; // '/foo/bar/1234'
```


### `pathDeclaration: string`  
Route path declaration (used for `path-to-regexp`)  

Example:  
```ts
const routeA = createRoute('/foo/bar/:baz');
location.href = '/foo/bar/1234';
routeA.pathDeclaration; // '/foo/bar/:baz'
routeA.path; // '/foo/bar/1234'
```

### `hasOpenedChildren: boolean` <Badge type="tip" text="computed" />   
`true` when any child route is currently opened.  

Example:   
```ts
const routeA = createRoute('/a');
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

### `createUrl(params?, query?, mergeQuery?): string`  
Generates full URL for route. Respects base URL and parent routes.  

Example:   
```ts
const starDetails = createRoute('/stars/:starId');
starDetails.createUrl({ starId: 1 }, { bar: 1 }); // /stars/1?bar=1

starDetails.createUrl({ starId: 1 }, { baz: 2 }, true); // /stars/1?bar=1&baz=2
```

More about `mergeQuery` you can read [here](/core/routeConfig#mergequery)   

### `path: string`  
Original path pattern used for route matching.  

Example:   
```ts
const starDetails = createRoute('/stars/:starId');
starDetails.path; // /stars/:starId
```

### `addChildren(...routes: AnyRoute[]): void` <Badge type="info" text="action" />     
Manually add child routes. Prefer `extend()` for typical use cases.  

### `removeChildren(...routes: AnyRoute[]): void` <Badge type="info" text="action" />     
Remove specified routes from children.  



## Configuration   
**Interface**: `RouteConfiguration`  
This is specific object used to detailed configure route.  
Here is list of configuration properties which can be helpful:  

### `abortSignal`   
`AbortSignal` used to destroy\cleanup route subscriptions  

### `meta`  
Additional object which can contains meta information   

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


### `params()`   
A function that can be needed when it is necessary to cast parsed path parameters from route to a certain type.   

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
Function allows you to add custom logic for "opened" statement   

::: info This check will only be called AFTER if this route is valid by `pathname`
:::

```ts
const route = createRoute('/numbers/:number', {
  checkOpened: (params) => {
    return !Number.isNaN(Number(params.number))
  }
});

route.open({ number: 'string' })

route.isOpened; // false
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
const route = createRoute('/foo/bar', {
  beforeOpen: () => {
    if (!auth.isAuth) {
      return false;
    }
  }
})
```

### `afterClose()`  
Calls after close route.   

### `afterOpen()`  
Calls after open route.   

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
route.open(); // /foo/bar/baz?openModal=true
```

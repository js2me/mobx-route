# routeConfig

Global route configuration.   
This object contains all global options for some behaviour of route and router instances  

## Basic example

```ts
import { routeConfig, createBrowserHistory } from "mobx-route";

const history = createBrowserHistory()

routeConfig.update({
  history,
  baseUrl: '/',
  mergeQuery: false,
});

routeConfig.get();
```

## Fields   

### `history`  
This is interface `History` from [`mobx-location-history` package](https://github.com/js2me/mobx-location-history).  
API is identical with [`history` NPM package](https://www.npmjs.com/package/history)  

Example:  

```ts
import {
  createHashHistory,
  createBrowserHistory,
  createMemoryHistory,
} from "mobx-location-history";

routeConfig.update({
  history: createHashHistory(),
  history: createBrowserHistory(),
  history: createMemoryHistory(),
})
```

::: tip 
Factory functions for this property is also can be exported from `mobx-route` package.  
:::

```ts
import {
  createHashHistory,
  createBrowserHistory,
  createMemoryHistory,
} from "mobx-route";

routeConfig.update({
  history: createHashHistory(),
  history: createBrowserHistory(),
  history: createMemoryHistory(),
})
```

### `queryParams`  
This is instance of the `QueryParams` class from [`mobx-location-history` package](https://github.com/js2me/mobx-location-history)  
This class is also can be exported from `mobx-route` package.  

### `baseUrl`

Specifies the base URL for all routes. This is used as a prefix for every route path and helps in forming complete URLs relative to this base. It's particularly useful when your application is not hosted at the root of a domain and you need consistent URL structures.  

### `mergeQuery`   
Unique mechanism for working with query parameters in the router.
This mechanism combines the current query parameters with the new ones when switching between routes.

If `true` - then when switching between routes, the query parameters will be merged.
If `false` - then when switching between routes, the query parameters will be rewritten.  

Example:   

_mergeQuery: false_   
```ts
routeConfig.update({
  mergeQuery: false,
})

const route1 = new Route('/foo/bar/baz');
const route2 = new Route('/bebe');

await route1.open(null, { query: { a: 1, b: 2, c: 3 } });

// location.search = '?a=1&b=2&c=3'

await route2.open(null, { query: { c: 4, d: 4, e: 5, f: 6 } });

// location.search = '?c=4&d=4&e=5&f=6'
```


_mergeQuery: true_   
```ts
routeConfig.update({
  mergeQuery: true,
})

const route1 = new Route('/foo/bar/baz');
const route2 = new Route('/bebe');

await route1.open(null, { query: { a: 1, b: 2, c: 3 } });

// location.search = '?a=1&b=2&c=3'

await route2.open(null, { query: { c: 4, d: 4, e: 5, f: 6 } });

// location.search = '?a=1&b=2&c=4&d=4&e=5&f=6'
```


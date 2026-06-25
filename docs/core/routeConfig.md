# routeConfig

Global route configuration.  
This object holds options shared by all `Route` and `Router` instances. Shape: **`RouteGlobalConfig`**.

## Basic example

```ts
import { routeConfig, createBrowserHistory } from "mobx-route";

const history = createBrowserHistory()

routeConfig.update({
  history,
  baseUrl: '/',
  mergeQuery: false,
});
```

## Methods

### `get()`
Returns the resolved config. On first access lazily creates defaults: a browser `history` and a `queryParams` instance bound to it.

```ts
routeConfig.get(); // { history, queryParams, ... }
```

### `update(partial)`
Merges a partial config into the current one. Pass only the fields you want to change.

```ts
routeConfig.update({
  baseUrl: '/app',
  mergeQuery: true,
});
```

Notes:
- Passing a new `history` replaces the previous one. If the previous `history` was an observable `mobx-location-history` instance, it is destroyed.
- Omitted `queryParams` are auto-created from the current `history`.

### `set(value)`
Replaces the entire stored config object — bypasses the merging logic of `update()`. Use when you want full control over the final value.

### `unset()`
Drops the stored config. The next `get()`/`update()` call will recreate defaults.

## Fields   

### `history`  
`History` from [`mobx-location-history`](https://js2me.github.io/mobx-location-history). API matches the [`history`](https://www.npmjs.com/package/history) NPM package.

Example:  

```ts
import {
  createHashHistory,
  createBrowserHistory,
  createMemoryHistory,
} from "mobx-route";

routeConfig.update({ history: createBrowserHistory() });
// routeConfig.update({ history: createHashHistory() });
// routeConfig.update({ history: createMemoryHistory() });
```

### `queryParams`  
`QueryParams` instance from [`mobx-location-history`](https://js2me.github.io/mobx-location-history) (also re-exported from `mobx-route`).

### `baseUrl`

URL prefix added in front of every route path — for apps not hosted at domain root.

### `mergeQuery`   
How query params behave when switching routes:
- `true` — current query is merged with the next one.
- `false` — current query is replaced by the next one.

Example:   

_mergeQuery: false_   
```ts
routeConfig.update({
  mergeQuery: false,
})

const route1 = createRoute('/foo/bar/baz');
const route2 = createRoute('/bebe');

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

const route1 = createRoute('/foo/bar/baz');
const route2 = createRoute('/bebe');

await route1.open(null, { query: { a: 1, b: 2, c: 3 } });

// location.search = '?a=1&b=2&c=3'

await route2.open(null, { query: { c: 4, d: 4, e: 5, f: 6 } });

// location.search = '?a=1&b=2&c=4&d=4&e=5&f=6'
```

### `createUrl`

Global fallback for URL building. Same signature as per-route [`createUrl`](/core/Route#createurl); used when a route has no own one.

### `formatLinkHref`

Transforms the final `href` before it lands on the `<a>` rendered by [`Link`](/react/Link). Use for global prefixes/domains (static export, proxy paths).

Example:

```ts
routeConfig.update({
  formatLinkHref: (href) => `/app${href}`,
});
```

### `fallbackPath`

URL used when `createUrl()` fails to compile a path (missing/invalid params). Defaults to `'/'`. Overridable per route via `RouteConfiguration.fallbackPath`.


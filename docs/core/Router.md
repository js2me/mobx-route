# Router

Centralized routing container.  
This class bundles a route collection together with `history` and `query` into a single value. Optional — most apps just use [`routeConfig`](/core/routeConfig).

## Usage

```ts
createRouter(config: RouterConfiguration)
new Router(config: RouterConfiguration) // class form
```
Accepts configuration with route collection and routing settings.  

### Basic example

```ts
import {
  createBrowserHistory,
  createRoute,
  createRouter,
  groupRoutes,
  QueryParams,
  routeConfig,
} from 'mobx-route';

const history = createBrowserHistory();
const queryParams = new QueryParams({ history });

routeConfig.update({
  history,
  queryParams,
  baseUrl: '/base-url',
});

export const routes = {
  home: createRoute('/'),
  projects: groupRoutes({
    index: createRoute('/projects', { index: true }),
    new: createRoute('/projects/new'),
    details: createRoute('/projects/:projectId'),
  }),
};

export const router = createRouter({
  routes,
  history,
  queryParams,
});


router.routes.home.open();
router.navigate(router.routes.home.createUrl());
router.history.back();
```

## Methods and properties  

### `routes`  

Root route collection. May contain nested `RouteGroup`s.

Example:   
```ts
router.routes.home.open();
router.routes.admin.routes.dashboard.isOpened;  
```

### `history`  
`History` instance from [`mobx-location-history`](https://js2me.github.io/mobx-location-history).

Example:  
```ts
router.history.back();
```

### `location`  
Reactive `location` from [`mobx-location-history`](https://js2me.github.io/mobx-location-history).

Example:
```ts
autorun(() => {
  console.log('Current path:', router.location.pathname);
});
```

### `query`  
`QueryParams` from [`mobx-location-history`](https://js2me.github.io/mobx-location-history), kept in sync with `location.search`.

Example:  
```ts
router.query.data; // { q: 'test' }
router.query.update({ bar: 1 });
router.query.data; // { q: 'test', bar: '1' }
```

### `navigate()` <Badge type="info" text="action" />   

Pushes (or replaces) the URL, optionally merging query.

Examples:  
```ts
// Basic navigation
router.navigate('/about');

// With query parameters
router.navigate('/search', {
  query: { q: 'test' },
  replace: true,
  mergeQuery: true,
});

// Using generated URL
const url = router.routes.profile.createUrl({ userId: 42 });
router.navigate(url);
```
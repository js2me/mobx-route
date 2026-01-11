# Router

Class for centralized routing management.  
Provides a common interface for working with history, location, and route collections.  

## Constructor

```ts
createRouter(config: RouterConfiguration)
new Router(config: RouterConfiguration) // class form
```
Accepts configuration with route collection and routing settings.  

### Basic example

```ts
import {
  createBrowserHistory,
  QueryParams,
  Route,
  routeConfig,
  RouteGroup,
  Router,
} from 'mobx-route';

const history = createBrowserHistory();
const queryParams = new QueryParams({ history });

routeConfig.set({
  history,
  queryParams,
  baseUrl: '/base-url',
});

export const routes = {
  home: createRoute('/'),
  projects: createRouteGroup({
    index: createRoute('/projects', { index: true }),
    new: createRoute('/projects/new'),
    details: createRoute('/projects/:projectId'),
  }),
};

export const router = createRouter({
  routes,
  history,
  location,
  queryParams,
});


router.routes.home.open();
router.navigate(router.router.home.createUrl());
router.history.back();
```

## Methods and properties  

### `routes`  

Root collection of application routes. Can contain nested `RouteGroups`.  

Example:   
```ts
router.routes.home.open();
router.routes.admin.routes.dashboard.isOpened;  
```

### `history`  
Interface for managing browser history from [`mobx-location-history` package](https://github.com/js2me/mobx-location-history).  
Handles navigation operations.   

Example:  
```ts
router.history.back();
```

### `location`  
Reactive object with browser location from [`mobx-location-history` package](https://github.com/js2me/mobx-location-history).  

Example:
```ts
autorun(() => {
  console.log('Current path:', router.location.pathname);
});
```

### `query`  
Interface for managing query parameters from [`mobx-location-history` package](https://github.com/js2me/mobx-location-history).  
Automatically synchronized with current url.  

Example:  
```ts
router.query.data; // { q: 'test' }
router.query.update({ bar: 1 });
router.query.data; // { q: 'test', bar: '1' }
```

### `navigate()` <Badge type="info" text="action" />   

Universal method for URL navigation.  

Examples:  
```ts
// Basic navigation
router.navigate('/about');

// With query parameters
router.navigate('/search', {
  query: { q: 'test' },
  replace: true
});

// Using generated URL
const url = router.routes.profile.createUrl({ userId: 42 });
router.navigate(url);
```
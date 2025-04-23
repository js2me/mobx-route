# Router

Optional class for groupping all routes and route groups together.   
Provides common routing functional

### Basic example

```ts
import {
  MobxLocation,
  QueryParams,
  Route,
  routeConfig,
  RouteGroup,
  Router,
} from 'mobx-route';

const history = new MobxHistory();
const location = new MobxLocation(history);
const queryParams = new QueryParams(location, history);

routeConfig.set({
  history,
  location,
  queryParams,
  baseUrl: '/base-url',
});

export const routes = {
  home: new Route('/'),
  projects: new RouteGroup({
    index: new Route('/projects', { index: true }),
    new: new Route('/projects/new'),
    details: new Route('/projects/:projectId'),
  }),
};

export const router = new Router({
  routes,
  history,
  location,
  queryParams,
});


router.routes.home.open();
router.navigate(router.router.home.createUrl());
router.history.back();
```

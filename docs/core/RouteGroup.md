# RouteGroup  

Class for grouping related routes and managing their state.
Allows to organize routes into hierarchical structures.   

## Constructor  
```ts
createRouteGroup(routes: TRoutesCollection)
new RouteGroup(routes: TRoutesCollection) // class form
```
Accepts an object with a collection of routes/groups.
Routes can be either regular `Route` objects or other entities, such as `RouteGroup` or `VirtualRoute`.  

### Basic example

```ts
import { createRouteGroup } from 'mobx-route';

const routesGroup = createRouteGroup({
  index: createRoute('/', { index: true }),
  fruits: createRoute('/fruits'),
  zombies: createRoute('/zombies'),
  memes: createRouteGroup({
    index: createRoute('/memes', { index: true }),
    list: createRoute('/memes/list'),
    create: createRoute('/memes/create'),
    edit: createRoute('/memes/edit/:id'),
  }),
})
```

## Methods and properties  


### `isOpened: boolean` <Badge type="tip" text="computed.struct" />   

Returns `true` if at least one route in the group is open.  

Example:  
```ts
const group = createRouteGroup({
  home: createRoute('/'),
  about: createRoute('/about')
});

group.routes.home.open();
group.isOpened; // true
```

### `indexRoute: Route | undefined` <Badge type="tip" text="computed.struct" />  
First found `index` route defined by [`isIndex` property](/core/Route.html#isindex-boolean)   

Example:  
```ts
const fruits = createRouteGroup({
  list: createRoute('/fruits', { index: true }),
  details: createRoute('/fruits/:id'),
});

fruits.routes.list === fruits.indexRoute; // true
```

### `open(...args: any[]): void`    

Main navigation method for the group. Behavior:  
1. Looks for an index route (with the `index: true` flag) in the group  
2. If an index route is found, opens it  
2. If no index route is found, tries to open the last nested group  
3. If there are no routes in the group, displays a warning (in DEV mode)   

Example:  
```ts
const group = createRouteGroup({
  index: createRoute('/', { index: true }),
  other: createRoute('/other')
});
group.open(); // Navigates to /

// Sending arguments
const paramGroup = createRouteGroup({
  index: createRoute('/user/:id', { index: true })
});
paramGroup.open({ id: 42 }); // /user/42
```

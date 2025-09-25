# VirtualRoute  

Class for creating routes with custom activation logic. Useful for implementing:  
- Modal windows routing  
- Feature toggles  
- Conditional UI states  
- Non-URL-based routing scenarios  

Unlike standard `Route`, doesn't depend on URL path. Activation state is determined by custom logic.  

## Constructor  
```ts
new VirtualRoute(config?: VirtualRouteConfiguration<TParams>)
```

**Configuration options:**  
- `initialParams`: initial params for this route
- `checkOpened`: Function/value determining if route is open  
- `open`: Custom open handler  
- `close`: Custom close handler  
- `queryParams`: Custom query params implementation  

Example:   

```ts
const ageModalRoute = new VirtualRoute<{ age: number }>({
  initialParams: { age: 0 },
  checkOpened: (route) => !!route.query.showAgeModal,
  open: (params, route) =>
    route.query.update({
      ...params,
      showAgeModal: 'true'
    }),
  close: (route) =>
    route.query.update({
      showAgeModal: undefined
    })
});

```


## Methods and properties  

### `isOpened: boolean` <Badge type="tip" text="computed" />  
Indicates whether route is active. Automatically updates when dependencies change.  

Example:   
```ts
const route = new VirtualRoute({
  checkOpened: () => Math.random() > 0.5
});

autorun(() => {
  console.log('Route state:', route.isOpened); // Randomly changes
});
```

### `params: TParams` <Badge type="info" text="observable" />  
Current virtual route parameters. Type is determined by generic type parameter.   
Example:  
```ts
const route = new VirtualRoute<{ userId: string }>();
route.open({ userId: '123' });
route.params?.userId; // '123'
```

### `query: IQueryParams`  
Interface for managing query parameters from [`mobx-location-history` package](https://github.com/js2me/mobx-location-history).  
Automatically synchronized with current url.  

### `open(params?, extraParams?: { query?, replace?   }): Promise<void> ` <Badge type="info" text="action" />  
Activates the route with execution flow:  
1. Updates params/query
2. Uses custom `open` handler if provided for change `isOpened` or sets `isOpened` `true   

### `close(): void` <Badge type="info" text="action" />  
Deactivates the route. Behavior depends on configuration:  
1. Uses custom close handler if provided  
2. Default behavior sets isOpened to false  

### `setOpenChecker(openChecker): void` <Badge type="info" text="action" />
Updates the `openChecker` value with the provided one.   
`openChecker` is a function or a boolean value that determines whether the route is open or not.

## Configuration   
**Interface**: `VirtualRouteConfiguration`  

This is specific object used to detailed configure virtual route.  
Here is list of configuration properties which can be helpful:  

### `abortSignal`   
`AbortSignal` used to destroy\cleanup route subscriptions  

### `meta`  
Additional object which can contains meta information   

```ts
const route = createVirtualRoute({
  meta: {
    memes: true
  }
});

console.log(route.meta?.memes); // true
```

### `open()`  
Custom implementation of open behaviour for this route.  
It can be helpful if you need custom open/close behaviour  

::: tip Will be used default implementation if is not specified:
:::

```ts
defaultOpenImplementation = () => true;
```

Examples:   
```ts
const route = new VirtualRoute({
  checkOpened: () => !!queryParams.data.yummiesDialog,
  open: () => {
    queryParams.update({ yummiesDialog: true });
    return true
  }
})
```


### `close()`  
Custom implementation of close behaviour for this route  
It can be helpful if you need custom open/close behaviour  

::: tip Will be used default implementation if is not specified:
:::

```ts
defaultCloseImplementation = () => false;
```

Examples:   
```ts
const route = new VirtualRoute({
  checkOpened: () => !!queryParams.data.yummiesDialog,
  close: () => {
    queryParams.update({ yummiesDialog: false });
    return false
  }
})
```

### `checkOpened()`   
Custom implementation of close/open statement for this route  
It can be helpful if you need custom open/close behaviour  

Examples:   
```ts
const route = new VirtualRoute({
  checkOpened: () => !!queryParams.data.yummiesDialog,
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
const route = new VirtualRoute('/foo/bar', {
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



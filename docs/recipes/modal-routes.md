# Modal routes   

There are various ways to create routes for modal windows.
However, in this library, we have a powerful tool: `VirtualRoute`, which can handle all the necessary
scenarios that fall outside the scope of conventional client-side routing.  

This recipe explains how to implement a modal route using `VirtualRoute`.  

There are two primary approaches here:   
- State via a `query` parameter   
- Local state (or `sessionStorage`, `localStorage`)  

## State via a `query` parameter  

One possible implementation:   

```ts
export const authModal = createVirtualRoute({
  checkOpened: (route) => Boolean(route.query.data.authModal),
  open: (_params, route) => {
    route.query.update({ authModal: true });
  },
  close: (route) => {
    route.query.update({ authModal: undefined });
  },
});
```

Variant with specifying additional parameters via query:     

```ts
export const authModal = createVirtualRoute({
  initialParams: (route) => ({
    paramA: String(route.query.data.paramA ?? ''),
    paramB: String(route.query.data.paramB ?? ''),
  }),
  checkOpened: (route) => Boolean(route.query.data.authModal),
  open: (params, route) => {
    route.query.update({ authModal: true, ...params });
  },
  close: (route) => {
    route.query.update({ authModal: undefined });
  },
});
```

## Local state  

Possible implementations:   

_local state_  
```ts
export const authModal = createVirtualRoute();
```

_using `localStorage`_  
```ts
export const authModal = createVirtualRoute({
  checkOpened: () => Boolean(localStorage.getItem('authModal')),
  open: () => {
    localStorage.setItem('authModal', 'true');
  },
  close: () => {
    localStorage.removeItem('authModal');
  },
});
```

::: warning `localStorage.getItem()` is not reactive
It means that route cannot use it to track changes to the `authModal` state **in dynamic**.
:::

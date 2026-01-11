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
  checkOpened: ({ query }) => !!query.data.authModal,
  open: (_, { query }) => {
    if (query.data.authModal) {
      query.update({ authModal: true });
    }
  },
  close: ({ query }) => {
    query.update({ authModal: null });
  },
});
```

Variant with specifying additional parameters via Query:     

```ts
export const authModal = createVirtualRoute({
  initialParams: ({ query }) => ({
    paramA: query.data.paramA || '',
    paramB: query.data.paramA || '',
  }),
  checkOpened: ({ query }) => !!query.data.authModal,
  open: (params, { query }) => {
    if (query.data.authModal) {
      query.update({ authModal: true, ...params });
    }
  },
  close: ({ query }) => {
    query.update({ authModal: undefined });
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
  checkOpened: () => !!localStorage.getItem('authModal'),
  open: () => {
    localStorage.setItem('authModal', true);
  },
  close: () => {
    localStorage.removeItem('authModal');
  },
});
```

::: warning `localStorage.getItem()` is not reactive
It means that route cannot use it to track changes to the `authModal` state **in dynamic**.
:::

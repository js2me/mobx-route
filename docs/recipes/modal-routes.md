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
export const modalRoute = new VirtualRoute({
  checkOpened: ({ query }) => !!query.data.yourModal,
  open: (_, { query }) => {
    query.update({ yourModal: true });
    return true;
  },
  close: ({ query }) => {
    query.update({ yourModal: undefined });
    return false;
  },
});
```

Variant with specifying additional parameters via Query:     

```ts
export const modalRoute = new VirtualRoute({
  initialParams: ({ query }) => ({
    paramA: query.data.paramA || '',
    paramB: query.data.paramA || '',
  }),
  checkOpened: ({ query }) => !!query.data.yourModal,
  open: (params, { query }) => {
    query.update({ yourModal: true, ...params });
    return true;
  },
  close: ({ query }) => {
    query.update({ yourModal: undefined });
    return false;
  },
});
```

## Local state  

One possible implementation:   

```ts
export const modalRoute = new VirtualRoute({
  open: () => true,
  close: () => false,
});
```

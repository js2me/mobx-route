# RouteViewGroup

`RouteViewGroup` renders **one child node** from the list:

- first opened route child by default;
- last opened route child when `useLastOpened` is enabled;
- last non-route child (fallback content) when no routes are open.

It is useful for route switching, not-found rendering, and grouped navigation layouts.

## Basic example

```tsx
import { createRoute } from 'mobx-route';
import { RouteView, RouteViewGroup } from 'mobx-route/react';

const routes = {
  allOrders: createRoute('/orders'),
  orderDetails: createRoute('/orders/:orderId'),
};

function Routing() {
  return (
    <RouteViewGroup>
      <RouteView route={routes.allOrders} view={AllOrdersPage} />
      <RouteView route={routes.orderDetails} view={OrderDetailsPage} />
      <div>Page not found</div>
    </RouteViewGroup>
  );
}
```

## Matching behavior

`RouteViewGroup` inspects children from top to bottom:

1. Finds opened route children.
2. Chooses one of them:
   - first opened route (`useLastOpened={false}`, default),
   - last opened route (`useLastOpened`).
3. If no route child is opened, renders the last non-route child (if present).
4. If `otherwise` is set and no route is active, performs navigation and renders `null`.

## Props

### `layout`

Wraps selected child node in a layout component.

```tsx
const Layout = ({ children }) => (
  <div className="page">
    <header>Orders</header>
    {children}
  </div>
);

<RouteViewGroup layout={Layout}>
  <RouteView route={routes.allOrders} view={AllOrdersPage} />
</RouteViewGroup>;
```

### `useLastOpened`

Changes priority strategy when several child routes are opened at once.

- default (`false`): first opened route in the children list wins;
- `true`: last opened route in the children list wins.

```tsx
<RouteViewGroup useLastOpened>
  <RouteView route={routeA} view={ViewA} />
  <RouteView route={routeB} view={ViewB} />
</RouteViewGroup>
```

### `otherwise`

Fallback navigation when no route child is currently opened.

Supports two variants:

- route entity: `otherwise={someRoute}`;
- URL string: `otherwise="/404"`.

```tsx
<RouteViewGroup otherwise={routes.notFound}>
  <RouteView route={routes.allOrders} view={AllOrdersPage} />
  <RouteView route={routes.orderDetails} view={OrderDetailsPage} />
</RouteViewGroup>
```

When `otherwise` is provided and no route is active, component returns `null` while fallback navigation is being triggered.

### Navigation options for `otherwise`

When `otherwise` is used, you can pass regular navigation options:

- `replace` - use `history.replace` instead of `history.push`;
- `state` - pass history state object;
- `query` - append query params to URL or pass them to route `.open(...)`.

For route `otherwise`, route params can be passed through `params`:

```tsx
<RouteViewGroup
  otherwise={routes.user}
  params={{ id: 42 }}
  query={{ from: 'orders' }}
  replace
>
  <RouteView route={routes.allOrders} view={AllOrdersPage} />
</RouteViewGroup>
```

## Notes

- Child order matters.
- Non-route children can be used as declarative fallback UI.
- If you need route-specific rendering only, use [`RouteView`](/react/RouteView) directly.

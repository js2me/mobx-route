# RouteView

Renders UI for a specific route when it is opened.

`RouteView` supports three rendering modes:

- through `view` component;
- through `loadView` (lazy-loaded component);
- through `children` (static node or render function).

### Example

```tsx
import { RouteView, RouteViewProps } from 'mobx-route/react';
import { routes } from '@/shared/config/routing';

interface FeedPageProps extends RouteViewProps<typeof routes.feed> {}

const FeedPage = ({ params }: FeedPageProps) => {
  const { feedName } = params

  return (
    <div>
      Feed {feedName}
    </div>
  )
}

function Routing() {
  return (
    <>
      <RouteView route={routes.feed} view={FeedPage} />
      <RouteView route={routes.users} view={UsersPage} />
      <RouteView
        route={routes.userDetails}
        loadView={async () =>
          (await import('@/pages/users/:userId')).UserDetailsPage
        }
        loading={GlobalLoader}
      />
      <RouteView route={routes.userDetails}>
        {(params, route) => (
          <div>{params.userId}</div>
        )}
      </RouteView>
    </>
  );
}
```

## Props

### `route`

Route entity (`Route` or `VirtualRoute`) to observe.

- When `route.isOpened === true`, `RouteView` renders `view`, `loadView` result, or `children`.
- When `route.isOpened === false`, `RouteView` renders `fallback` (or `null` if `fallback` is not provided).

### `view`

React component to render for opened route.

```tsx
<RouteView route={routes.feed} view={FeedPage} />
```

The component receives:

- `params` (typed from the route declaration);
- `children` (if passed to `RouteView`).

### `loadView`

Lazy view factory: `(route) => Promise<Component>`.

```tsx
<RouteView
  route={routes.userDetails}
  loadView={async (route) => (await import('./user-page')).UserPage}
  loading={GlobalLoader}
/>
```

`RouteView` internally wraps this with `react-simple-loadable` and forwards:

- `loading`
- `preload`
- `throwOnError`

### `fallback`

Rendered when route is not opened:

```tsx
<RouteView route={routes.feed} view={FeedPage} fallback={<NotFound />} />
```

### `children`

Two modes are supported:

1) Static node:

```tsx
<RouteView route={routes.feed}>
  <div>Feed page</div>
</RouteView>
```

2) Render function:

```tsx
<RouteView route={routes.userDetails}>
  {(params, route) => <div>{params.userId}</div>}
</RouteView>
```

When `route` is not provided, `children` is always rendered, and function form is called without arguments.

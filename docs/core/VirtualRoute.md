# VirtualRoute

Class for creating routes with custom activation logic. Useful for implementing:
- Modal windows routing
- Feature toggles
- Conditional UI states
- Non-URL-based routing scenarios

Unlike `Route`, `VirtualRoute` does not parse URL path declarations. Open state is controlled by your handlers and `checkOpened`.

## Constructor

```ts
createVirtualRoute(config?: VirtualRouteConfiguration<TParams>)
new VirtualRoute(config?: VirtualRouteConfiguration<TParams>)
```

_Simple example:_  

```ts
const profileDialogRoute = createVirtualRoute<{ userId: string }>();

await profileDialogRoute.open({ userId: '42' });

profileDialogRoute.isOpened; // true
profileDialogRoute.params; // { userId: '42' }

await profileDialogRoute.close();

profileDialogRoute.isOpened; // false
profileDialogRoute.params; // null
```

_Custom open close state handling:_  
```ts
const ageModalRoute = createVirtualRoute<{ age: number }>({
  initialParams: { age: 0 },
  checkOpened: (route) => route.query.data.showAgeModal === 'true',
  open: (params, route) =>
    route.query.update({
      ...params,
      showAgeModal: 'true',
    }),
  close: (route) =>
    route.query.update({
      showAgeModal: undefined,
    }),
});
```

## Properties and methods

### `isOpened` <Badge type="tip" text="computed" />
Main flag for UI: `true` means route is currently open.

```ts
const dialogRoute = createVirtualRoute({
  checkOpened: (route) => route.query.data.modal === 'profile',
});

dialogRoute.isOpened; // use this in components to show/hide dialog
```

### `isOpening` <Badge type="tip" text="computed" />
`true` while async opening logic is still running.

```ts
const slowRoute = createVirtualRoute({
  open: async () => {
    await new Promise((r) => setTimeout(r, 400));
  },
});

slowRoute.open();
slowRoute.isOpening; // true for a short time
```

### `isClosing` <Badge type="tip" text="computed" />
`true` while closing is in progress.

```ts
const route = createVirtualRoute({
  close: () => {
    localStorage.setItem('lastModal', 'closed');
  },
});

route.close();
route.isClosing; // true while close is being processed
```

### `params` <Badge type="info" text="observable" />
Stores current route params; after successful close becomes `null`.

```ts
const panelRoute = createVirtualRoute<{ tab: 'info' | 'settings' }>();

await panelRoute.open({ tab: 'settings' });
panelRoute.params?.tab; // 'settings'

await panelRoute.close();
panelRoute.params; // null
```

### `query`
Access to query params object used by this route.

```ts
const filtersRoute = createVirtualRoute({
  checkOpened: (route) => route.query.data.filters === '1',
});

filtersRoute.query.update({ filters: '1' });
```

### `open(params?, extra?)` <Badge type="info" text="action" />
Opens the route manually and optionally updates query.

```ts
const profileRoute = createVirtualRoute<{ userId: string }>();

await profileRoute.open(
  { userId: '42' },
  { query: { modal: 'profile' }, replace: true },
);
```

### `close()` <Badge type="info" text="action" />
Closes the route manually.

```ts
const helpRoute = createVirtualRoute({
  checkOpened: (route) => route.query.data.modal === 'help',
});

await helpRoute.close();
```

### `setOpenChecker()` <Badge type="info" text="action" />
Changes open condition at runtime.

```ts
const route = createVirtualRoute();

route.setOpenChecker((r) => r.query.data.modal === 'settings');
```

### `isOuterOpened` <Badge type="info" text="observable.ref" />
Raw result of current `checkOpened`. Usually needed only for debugging.

```ts
const route = createVirtualRoute({
  checkOpened: (r) => r.query.data.modal === 'x',
});

console.log(route.isOuterOpened);
```

## Configuration

Interface: `VirtualRouteConfiguration<TParams>`.

### `abortSignal`
Abort signal for route lifecycle cleanup.

```ts
const controller = new AbortController();
const route = createVirtualRoute({
  abortSignal: controller.signal,
});

controller.abort();
```

### `queryParams`
Custom query params implementation for this route.

```ts
const route = createVirtualRoute({
  queryParams: myCustomQueryParams,
});
```

### `initialParams`
Initial params value or factory `(route) => params`.

```ts
const route = createVirtualRoute<{ page: number }>({
  initialParams: { page: 1 },
});
```

### `checkOpened`
Function `(route) => boolean` that defines external open state.

```ts
const route = createVirtualRoute({
  checkOpened: (r) => r.query.data.modal === 'auth',
});
```

### `getAutoOpenParams`
Called when `checkOpened` turns `true` and route auto-opens.

Example:
```ts
const modalRoute = createVirtualRoute<{ id: string | null }>({
  checkOpened: (route) => Boolean(route.query.data.modalId),
  getAutoOpenParams: (route) => ({
    params: {
      id: String(route.query.data.modalId ?? ''),
    },
    extra: {
      query: { modal: 'true' },
      replace: true,
    },
  }),
});
```

### `beforeOpen`
Hook `(params, route) => void | boolean | Promise<void | boolean>`.
Return `false` to reject opening.

Example:
```ts
const authModalRoute = createVirtualRoute<{ redirectTo?: string }>({
  checkOpened: (route) => route.query.data.modal === 'auth',
  beforeOpen: (params) => {
    if (!auth.canOpenModal) {
      return false;
    }

    if (params?.redirectTo && !params.redirectTo.startsWith('/')) {
      return false;
    }
  },
});
```

### `open`
Custom open handler `(params, route) => void | boolean | Promise<void | boolean>`.
Return `false` to reject opening.

```ts
const route = createVirtualRoute<{ id: string }>({
  open: (params, r) => {
    r.query.update({ modalId: params?.id });
  },
});
```

### `afterOpen`
Hook called after successful opening.

```ts
const route = createVirtualRoute({
  afterOpen: () => {
    analytics.track('modal_opened');
  },
});
```

### `beforeClose`
Hook `() => void | boolean | Promise<void | boolean>`.
Return `false` to reject closing.

Example:
```ts
const editorModalRoute = createVirtualRoute({
  checkOpened: (route) => route.query.data.modal === 'editor',
  beforeClose: () => {
    if (hasUnsavedChanges) {
      return false;
    }
  },
});
```

### `close`
Custom close handler `(route) => void | boolean`.
Return `false` to reject closing.

```ts
const route = createVirtualRoute({
  close: (r) => {
    r.query.update({ modal: undefined });
  },
});
```

### `afterClose`
Configuration field exists in API, but current implementation does not call it.

```ts
const route = createVirtualRoute({
  afterClose: () => {
    // currently not called by implementation
  },
});
```

### `meta`
Arbitrary metadata in configuration object (not exposed as a `VirtualRoute` instance field).

Example:

```ts
const route = createVirtualRoute({
  meta: {
    memes: true,
  },
});
```

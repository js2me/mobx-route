# groupRoutes

Route group factory.  
Returns a `RouteGroup` — a container that gives a set of routes a shared `isOpened` and a default child (`indexRoute`) for `group.open()`. Class form: `new RouteGroup()`.

## Usage

```ts
groupRoutes(routes, indexRoute?)
new RouteGroup(routes, indexRoute?)
```

Accepts an object of routes and nested groups — `Route`, `RouteGroup`, or `VirtualRoute`.

Optional `indexRoute` sets the default child explicitly (overrides auto-detection by `index: true` on a child).

### Basic example

```ts
import { groupRoutes, createRoute } from 'mobx-route';

const routesGroup = groupRoutes({
  index: createRoute('/', { index: true }),
  fruits: createRoute('/fruits'),
  memes: groupRoutes({
    index: createRoute('/memes', { index: true }),
    list: createRoute('/memes/list'),
    details: createRoute('/memes/:id'),
  }),
});

routesGroup.routes.fruits.open();
routesGroup.isOpened; // true if any child is open
```

```ts
export const admin = groupRoutes({
  index: createRoute('/admin', { index: true }),
  users: createRoute('/admin/users'),
  settings: createRoute('/admin/settings'),
});

admin.routes.users.open(); // prefer opening child routes directly
```

## Methods and properties

### `routes`

The route collection object passed to the constructor.

### `isOpened` <Badge type="tip" text="computed" />

`true` if at least one child route (or its descendants) is open.

```ts
admin.routes.users.open();
admin.isOpened; // true
```

### `indexRoute` <Badge type="tip" text="computed" />

Default child for `group.open()`. Resolved in order:

1. `indexRoute` passed to `groupRoutes(routes, indexRoute)` or `new RouteGroup(routes, indexRoute)`
2. First child with [`isIndex`](/core/Route#isindex) (`index: true` in config)

```ts
const explicitIndex = createRoute('/custom-index', { index: true });
const fruits = groupRoutes(
  { list: createRoute('/fruits'), details: createRoute('/fruits/:id') },
  explicitIndex,
);
fruits.indexRoute === explicitIndex; // true
```

### `canNavigate` <Badge type="tip" text="computed" />

`true` if `open()` has a target — either an own `indexRoute` or a nested `RouteGroup` that itself can navigate. Useful to render group entry points conditionally (e.g. hide a sidebar section when it has nowhere to go).

```ts
const empty = groupRoutes({ foo: createRoute('/foo') });
empty.canNavigate; // false

const withIndex = groupRoutes({
  index: createRoute('/dashboard', { index: true }),
});
withIndex.canNavigate; // true
```

### `open(...args)`

Opens the group's `indexRoute`. Use it for "go to this section's default page"; call `group.routes.<child>.open()` for everything else.

```ts
export const projects = groupRoutes({
  list: createRoute('/projects', { index: true }),
  new: createRoute('/projects/new'),
  details: createRoute('/projects/:id'),
});

projects.open(); // → /projects (opens `list`)

projects.routes.new.open();
projects.routes.details.open({ id: 42 });
```

Ways to define the index:
- `{ index: true }` on a child route
- second argument: `groupRoutes({ ... }, explicitIndexRoute)`

`group.open()` is not a general-purpose `navigate()` helper — export the group and call `group.routes.<child>.open()` at call sites.

Without any navigable target (`canNavigate === false`), `open()` does nothing — [Warning #1](/warnings/1).

## Nested groups

If the parent has **no index**, `open()` walks child keys **in declaration order** and delegates to the **first** nested `RouteGroup` that can navigate (`canNavigate === true`). Non-group children and groups with no reachable index are skipped.

```ts
export const app = groupRoutes({
  shop: groupRoutes({ index: createRoute('/shop', { index: true }) }),
  admin: groupRoutes({ index: createRoute('/admin', { index: true }) }),
});

app.open();
// 1. `app` has no index → walk children in order
// 2. first key is `shop` → it's a group with an index → delegate
// 3. shop.open() → shop's index → /shop
```

A group with no index of its own is skipped, the search continues to the next sibling:

```ts
export const app = groupRoutes({
  noindex: groupRoutes({
    foo: createRoute('/foo'),
    bar: createRoute('/bar'),
  }),
  dashboard: groupRoutes({
    index: createRoute('/dashboard', { index: true }),
  }),
});

app.open();
// `noindex` cannot navigate → skipped
// `dashboard` can → delegate → /dashboard
```

If you do not want to rely on declaration order at all, pass the index explicitly: `groupRoutes(routes, myIndexRoute)`.

## When it helps

- Logical app sections (`admin`, `shop`, `settings`)
- Passing a subtree to a layout or guard
- `section.open()` only for “go to this section’s home” — not instead of `section.routes.page.open()`

Groups organize routes; they do not create a separate history — that stays in [`routeConfig`](/core/routeConfig).

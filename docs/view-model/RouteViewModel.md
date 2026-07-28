# RouteViewModel

Route-bound view model base class.  
Extends `ViewModelBase` from [`mobx-view-model`](https://js2me.github.io/mobx-view-model) to expose `pathParams`/`query` and to keep the last params around during unmount so exit transitions can finish.

## What it changes vs. `ViewModelBase`

- `payload` returns the current route params, or the last seen ones (`lastPayload`) after the route closes.
- `isMounted` is `true` only when the view model is mounted **and** the route is open.

## API

### `route`

Abstract readonly route entity that must be provided by a concrete view model.

### `pathParams`

Current path params for the route view model.

### `query`

Returns current query params:
- route-specific query when supported by the route entity;
- global query params from `routeConfig.get()` otherwise.

### Example

```tsx
import { RouteViewModel } from 'mobx-route/view-model';
import { userRoute } from '@/shared/config/routing';
import { withViewModel } from "mobx-view-model";

class UserPageVM extends RouteViewModel<typeof userRoute> {
  route = userRoute;
}

export const UserPage = withViewModel(UserPageVM, () => {
  return <div>User page</div>
});
```

## `withRoute` mixin

When you need the route benefits (`pathParams`, `query`, `isMounted`) but your view model already extends a custom base class, use the `withRoute` mixin instead of `RouteViewModel`.

`withRoute` takes a route entity and returns a class enhancer that can be applied to any `ViewModelBase` subclass:

```tsx
import { withRoute } from 'mobx-route/view-model';
import { ViewModelBase } from 'mobx-view-model';
import { userRoute } from '@/shared/config/routing';
import { withViewModel } from "mobx-view-model";

// With ViewModelBase directly
class UserPageVM extends withRoute(userRoute)(ViewModelBase) {}

// With a custom AppVM base class
class AppVM extends ViewModelBase {
  /* shared app-level logic */
}

class UserPageVM extends withRoute(userRoute)(AppVM) {}
```

The mixin provides the same properties as `RouteViewModel` (`route`, `payload`, `pathParams`, `query`, `isMounted`) but doesn't require you to declare `route` on the subclass — it's baked in from the mixin call.

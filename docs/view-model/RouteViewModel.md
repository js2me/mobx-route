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

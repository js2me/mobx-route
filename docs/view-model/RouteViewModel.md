# RouteViewModel

Abstract class for integration with [`mobx-view-model` library](https://js2me.github.io/mobx-view-model)  

`RouteViewModel` binds a route entity to a view model and gives a stable API for route data:
- `pathParams` for path params
- `query` for current query params

## Modifications

- `payload` now keeps the latest known route params via `lastPayload` when the route is closed.
- `isMounted` is `true` only when both `ViewModelBase.isMounted` and `route.isOpened` are `true`.

## API

### `route`

Abstract readonly route entity that must be provided by a concrete view model.

### `pathParams`

Current path params for the route view model.

### `query`

Returns current query params:
- route-specific query when supported by the route entity;
- global query params from `routeConfig` otherwise.

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

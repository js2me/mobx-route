# isRouteEntity

Route entity type guard.  
This function checks whether a value is a `Route`, `VirtualRoute`, or `RouteGroup` and narrows it to `AnyRouteEntity`.

## Signature

```ts
isRouteEntity(route: unknown): route is AnyRouteEntity
```

Checks for `isOpened` on the value. Narrows `unknown` so route methods are safe to call.

## Example

```ts
import { isRouteEntity } from 'mobx-route';

const value: unknown = getRouteLikeValue();

if (isRouteEntity(value)) {
  value.open();
}
```

# isRouteEntity

Utility type guard for checking whether a value is a route entity.

## Signature

```ts
isRouteEntity(route: unknown): route is AnyRouteEntity
```

## Example

```ts
import { isRouteEntity } from 'mobx-route';

const value: unknown = getRouteLikeValue();

if (isRouteEntity(value)) {
  console.log(value.isOpened);
}
```

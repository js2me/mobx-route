---
"mobx-route": major
---

Remove `TParentRoute` generic parameter from `Route`, `RouteConfiguration`, and `createRoute`

- `Route` now has 4 generics instead of 5: `TPath, TInputParams, TOutputParams, TQueryParams`
- `RouteConfiguration` now has 4 generics instead of 5
- `createRoute` now has 4 generics instead of 5 — `TQueryParams` moved from 5th to 4th position
- `parent` property type changed from `TParentRoute` to `AnyRoute | null`
- `AnyRoute` and `Infer*` utility types updated to 4 generics

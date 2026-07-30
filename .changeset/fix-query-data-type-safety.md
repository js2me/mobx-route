---
"mobx-route": major
---

Fix type-safety bug: `Route.query.data` and `VirtualRoute.query.data` now correctly return `Record<string, string>` instead of the claimed `TQueryParams` type.

**Breaking Change:** `query.data` is now typed as `Record<string, string>` (the actual runtime type) instead of the `TQueryParams` generic parameter. The `TQueryParams` generic is still used for typing query parameters passed to `open()`, `createUrl()`, and navigation methods.

If you previously relied on `route.query.data.page` being typed as `number`, you now need to:
- Use `QueryParam` with `queryParamPresets.number` for per-field typed access
- Or cast manually: `Number(route.query.data.page)`

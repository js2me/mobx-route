---
"mobx-route": major
---

Removed `protected abortController` property from `Route` and `VirtualRoute`. If you were accessing `abortController` directly, you now need to manage abort/cleanup yourself or use the `abortSignal` config option.

- `VirtualRoute.isOpened` now returns `false` after `destroy()` is called
- `VirtualRoute.destroy()` now also sets status to `'unknown'` and explicitly disposes the reaction
- Added `react-dom` as an optional peer dependency

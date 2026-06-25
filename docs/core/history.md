# History

MobX-powered history wrappers, re-exported from [`mobx-location-history`](https://js2me.github.io/mobx-location-history).

## Usage

```ts
import {
  createBrowserHistory,
  createHashHistory,
  createMemoryHistory,
} from 'mobx-route';

const history = createBrowserHistory();
```

### `createBrowserHistory()`
History backed by `window.history`. Default choice for web apps.

### `createHashHistory()`
History stored in `location.hash`. Useful when server-side routing isn't available.
See [Hash routing](/recipes/hash-routing).

### `createMemoryHistory()`
In-memory history with no DOM dependency. Ideal for testing or React Native.

---

Full API (reactive `location`, `push`, `replace`, `back`, `go`, `block`, etc.) — see [`mobx-location-history` docs](https://js2me.github.io/mobx-location-history).

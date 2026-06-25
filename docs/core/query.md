# Query

Reactive query-parameter management, re-exported from [`mobx-location-history`](https://js2me.github.io/mobx-location-history).

## Usage

```ts
import { QueryParams, createQueryParams } from 'mobx-route';

const queryParams = new QueryParams({ history });
// or
const queryParams = createQueryParams({ history });

queryParams.update({ q: 'mobx' });
queryParams.data; // { q: 'mobx' }
```

### `QueryParams`
Observable container that keeps `data` in sync with `location.search`.

### `QueryParam`
Single reactive query field with type-safe parsing/serialization.

### `createQueryParams()` / `createQueryParam()`
Factory shortcuts for `new QueryParams()` / `new QueryParam()`.

### `queryParamPresets`
Built-in type presets (`number`, `boolean`, `array`, etc.) for `QueryParam`.

### `parseSearchString()` / `buildSearchString()`
Low-level helpers for converting between `?foo=1&bar=2` and objects.

---

Full API (field models, presets, serialization options, etc.) — see [`mobx-location-history` docs](https://js2me.github.io/mobx-location-history).

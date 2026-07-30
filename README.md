<img src="docs/public/logo.png" align="right" width="156" alt="logo" />

# mobx-route

[![NPM version][npm-image]][npm-url] [![build status][github-build-actions-image]][github-actions-url] [![npm download][download-image]][download-url] [![bundle size][bundlephobia-image]][bundlephobia-url]


[npm-image]: http://img.shields.io/npm/v/mobx-route.svg
[npm-url]: http://npmjs.org/package/mobx-route
[github-build-actions-image]: https://github.com/js2me/mobx-route/workflows/Builds,%20tests%20&%20co/badge.svg
[github-actions-url]: https://github.com/js2me/mobx-route/actions
[download-image]: https://img.shields.io/npm/dm/mobx-route.svg
[download-url]: https://npmjs.org/package/mobx-route
[bundlephobia-url]: https://bundlephobia.com/result?p=mobx-route
[bundlephobia-image]: https://badgen.net/bundlephobia/minzip/mobx-route

🚀 Simple and lightweight **typed** MobX router 🚀
_Uses [`path-to-regexp`](https://www.npmjs.com/package/path-to-regexp) power for path matching_

### [📖 Read the docs →](https://js2me.github.io/mobx-route/)

---

## Quick Start

```ts
import { createRoute } from "mobx-route";

const userDetails = createRoute("/users/:id");

// Path params are required — TypeScript enforces it
await userDetails.open({ id: 1 });

userDetails.isOpened; // true
userDetails.params;   // { id: "1" } — fully typed
```

---

## ✨ Features

### 🔗 Nested Routes with `.extend()`

Build route trees naturally — no config arrays, no `<Routes>` wrappers:

```ts
const users = createRoute("/users");
const userDetails = users.extend("/:userId");
const userPhotos = userDetails.extend("/photos");

// Path is auto-concatenated: /users/:userId/photos
await userPhotos.open({ userId: 42 });
// → /users/42/photos

users.isOpened;        // true (parent is open too)
users.hasOpenedChildren; // true
```

### 🛡️ Route Guards & Redirects

Protect routes with `beforeOpen` — cancel navigation or redirect:

```ts
const dashboard = createRoute("/dashboard", {
  beforeOpen: async () => {
    if (!await isAuthenticated()) {
      return { url: "/login", replace: true }; // redirect
    }
    // return undefined → proceed
  },
  checkOpened: () => currentUser.isAuthorized, // reactive predicate
});
```

### 🔮 Virtual Routes for Modals & Drawers

Same `.open()` / `.close()` / `.isOpened` API — but no URL involved:

```ts
const authModal = createVirtualRoute({
  checkOpened: (route) => route.query.data.modal === "auth",
  open: (_, route) => route.query.update({ modal: "auth" }),
  close: (route) => route.query.update({ modal: undefined }),
  beforeClose: () => !hasUnsavedChanges, // prevent closing
});

authModal.isOpened;  // reactive — auto-updates from query
authModal.isClosing; // for exit animations
```

### 🎯 Typed Query Params

```ts
const search = createRoute<
  "/search",
  {},
  {},
  { q: string; page?: number; sort?: "asc" | "desc" }
>("/search");

// TQueryParams types the INPUT — what you pass to open()
await search.open({}, { query: { q: "mobx", page: 1 } });

// query.data is always Record<string, string> at runtime (values come from URL)
search.query.data.q;    // string
search.query.data.page; // string | undefined — use Number() or QueryParam for typed access
```

### 🔄 `update()` for In-Place Changes

Replace params without polluting browser history:

```ts
await userRoute.open({ userId: 1 }, { query: { tab: "profile" } });
await userRoute.update({ userId: 2 });
// → /users/2?tab=profile (replace: true, mergeQuery: true by default)
```

### 🧩 React Integration

```tsx
import { RouteView, RouteViewGroup, Link } from "mobx-route/react";

// Declarative route rendering
<RouteView route={userRoute} view={UserPage} fallback={<Loading />} />

// Route switching with fallback
<RouteViewGroup otherwise={notFoundRoute}>
  <RouteView route={homeRoute} view={HomePage} />
  <RouteView route={userRoute} view={UserPage} />
  <div>Not found</div>
</RouteViewGroup>

// Type-safe links
<Link to={userRoute} params={{ userId: 42 }}>Profile</Link>
```

### 🧠 View Model Integration

```ts
import { RouteViewModel } from "mobx-route/view-model";

class UserPageVM extends RouteViewModel<typeof userRoute> {
  route = userRoute;
  // payload, pathParams, query, isMounted — all built-in
}
```

### 🌍 Optional Path Segments & Wildcards

```ts
// Optional segment
const route = createRoute("/users{/:tab}");
route.open();          // → /users
route.open({ tab: 1 }); // → /users/1

// Wildcard/rest params
const docs = createRoute("/docs/*rest");
docs.open({ rest: ["api", "v2", "auth"] }); // → /docs/api/v2/auth
```

### 📦 Tree-Shakeable Subpath Exports

Only pay for what you use:

```ts
import { createRoute } from "mobx-route";              // core only
import { RouteView, Link } from "mobx-route/react";    // + React
import { RouteViewModel } from "mobx-route/view-model"; // + VM
```

---

## Installation

```bash
npm install mobx-route
# or
pnpm add mobx-route
# or
yarn add mobx-route
```

Peer dependencies (React integration is optional):

```bash
npm install mobx
# For React:
npm install mobx-react-lite react react-dom
```

---

## Contribution Guide

Want to contribute? [Follow this guide](https://github.com/js2me/mobx-route/blob/master/CONTRIBUTING.md)

---

## License

[MIT](https://github.com/js2me/mobx-route/blob/master/LICENSE)

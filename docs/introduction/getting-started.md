---
title: Getting started
---

# Getting started

## Installation

::: code-group

```bash [npm]
npm install {packageJson.name}
```

```bash [yarn]
yarn add {packageJson.name}
```

```bash [pnpm]
pnpm add {packageJson.name}
```

:::

## Integration with React

```tsx
import { createRoute } from "mobx-route";
import { RouteView, Link } from "mobx-route/react";

const route = createRoute('/foo/bar/:baz');

...
<RouteView route={route} view={() => <div>Hello!</div>} />
...
<Link to={route} params={{ baz: 1 }} />
```

## Writing first routes

```ts
import { createRoute, createRouteGroup } from "mobx-route";

const feed = createRoute("/");
const users = createRoute("/users");
const userDetails = users.extend("/:userId");

export const routes = {
  feed,
  users,
  userDetails,
  memes: createRouteGroup({
    list: createRoute("/memes", { index: true }),
    details: createRoute("/memes/:memeId"),
  }),
};
```

## Attach routes to views in React

```tsx
import { observer } from "mobx-react-lite";
import { routes } from "@/shared/config/routing";
import { RouteView, Link } from "mobx-route/react";

const AllUsersPage = () => {
  return (
    <div>
      <Link to={routes.userDetails} params={{ userId: 1 }}>
        Open user with id 1
      </Link>
    </div>
  );
};

const UserDetailsPage = observer(() => {
  const { params } = routes.userDetails.data!;

  return <div>{`User id: ${params.userId}`}</div>;
});

export const App = () => {
  return (
    <div>
      <RouteView route={routes.userDetails} view={AllUsersPage} />
      <RouteView route={routes.users} view={UserDetailsPage} />
    </div>
  );
};
```

# Protected routes   

Protected routes are a very specific thing, dependent on technical project requirements,
usually used for implementing routes closed to unauthorized users.   

Implementation of such routes can be achieved in different ways   


## Configure protection using [`beforeOpen`](/core/Route#beforeopen) and [`checkOpened`](/core/Route#checkopened)

Example:  
```ts
import { currentUser } from "@/entities/user"

const route = createRoute('/foo/bar', {
  checkOpened: () => currentUser.isAuthorized,
  beforeOpen: () => {
    if (!currentUser.isAuthorized) {
      return false;
    }
  },
})
```

`beforeOpen` can also return `{ url: '/login', replace: true }` to redirect instead of opening.


## Redirect to login on unauthorized access

When a user tries to open a protected route, you can redirect them to `/login` by returning a redirect object from [`beforeOpen`](/core/Route#beforeopen):

```ts
import { createRoute } from 'mobx-nuclear-route'
import { currentUser } from "@/entities/user"

const loginRoute = createRoute('/login')
const dashboardRoute = createRoute('/dashboard', {
  beforeOpen: () => {
    if (!currentUser.isAuthorized) {
      return {
        url: '/login',
        replace: true,
      }
    }
  },
})

// User is not authorized → navigating to /dashboard redirects to /login
history.push('/dashboard')
// URL is now /login, dashboardRoute.isOpened is false
```

::: tip Use `replace: true`
With `replace: true` the redirect replaces the current history entry, so the user won't go back to the protected route by pressing the browser Back button.
:::


## Async authorization check

When authorization status is determined by an async call (e.g. a session validation API request), [`beforeOpen`](/core/Route#beforeopen) supports returning a `Promise`. While the promise is pending, [`isOpening`](/core/Route#isopening) will be `true` and [`isOpened`](/core/Route#isopened) will be `false`:

```ts
import { createRoute } from 'mobx-nuclear-route'
import { checkSession } from "@/entities/session"

const loginRoute = createRoute('/login')
const dashboardRoute = createRoute('/dashboard', {
  beforeOpen: async () => {
    const session = await checkSession()

    if (!session.isAuthorized) {
      return {
        url: '/login',
        replace: true,
      }
    }
  },
})

// User navigates to /dashboard
history.push('/dashboard')

// While checkSession() is in flight:
dashboardRoute.isOpening // true
dashboardRoute.isOpened  // false

// After checkSession() resolves and user is not authorized:
// URL is /login, dashboardRoute.isOpened is false
```

::: warning `isOpened` is not reliable without `await`
When using an async `beforeOpen`, always `await route.open()` before reading `isOpened`. Without `await`, the route is still in the `isOpening` state.
:::

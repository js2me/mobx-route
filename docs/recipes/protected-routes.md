# Protected routes   

Protected routes are a very specific thing, dependent on technical project requirements,
usually used for implementing routes closed to unauthorized users.   

Implementation of such routes can be achieved in different ways   


## Configure protection using [`beforeOpen`](/core/Route#beforeopen) and [`checkOpened`](/core/Route#checkopened)

Example:  
```ts
import { currentUser } from "@/entities/user"

const route = createRoute('/foo/bar', {
  checkOpened: () => {
    return currentUser.isAuthorized;
  },
  beforeOpen: () => {
    return currentUser.isAuthorized;
  }
})
```

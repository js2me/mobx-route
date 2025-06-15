# Protected routes   

Protected routes are a very specific thing, dependent on technical project requirements,
usually used for implementing routes closed to unauthorized users.   

Implementation of such routes can be achieved in different ways   


## Configure protection using [`beforeOpen`](/core/Route#beforeenter) and [`checkOpened`](/core/Route#checkopened)

Example:  
```ts
import { currentUser } from "@/entities/user"

const route = new Route('/foo/bar', {
  checkOpened: () => {
    return currentUser.isAuthorized;
  },
  beforeOpen: () => {
    return currentUser.isAuthorized;
  }
})
```

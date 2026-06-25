# Setting Up Hash Routing  

### What Is Hash Routing?  
Hash routing is a browser history mode where the page path is stored after the `#` symbol in the URL. This approach is particularly useful for:

- Static websites without server-side routing  
- Servers that don't support HTML5 History API  
- Simple single-page applications (SPAs)  

### Step-by-Step Setup  

```ts
// 1. Import  
import { routeConfig, createHashHistory, createRoute } from "mobx-route";

// 2. Configure hash history  
routeConfig.update({
  history: createHashHistory(),
});

// 3. Mark routes as hash-based  
export const homeRoute = createRoute('/home', { hash: true });
export const aboutRoute = createRoute('/about', { hash: true });
```

Both `createHashHistory()` and `{ hash: true }` on routes are required. Routes with `{ hash: true }` match `location.hash` (without `#`) and generate URLs with a `#` prefix.

# Setting Up Hash Routing  

### What Is Hash Routing?  
Hash routing is a browser history mode where the page path is stored after the `#` symbol in the URL. This approach is particularly useful for:

- Static websites without server-side routing  
- Servers that don’t support HTML5 History API  
- Simple single-page applications (SPAs)  

### Step-by-Step Setup  

```ts
// 1. Import  
import { routeConfig, createHashHistory } from "mobx-route";

// 2. Update router configuration  
routeConfig.update({
  history: createHashHistory()
})
```
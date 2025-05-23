# Implementing Memory Routing for Non-Browser Environments  

### What Is Memory Routing?  
Memory routing (or **memory history**) manages navigation state internally _without modifying the browser URL_. Ideal for:  

- Unit/integration testing  
- Server-side rendering (SSR)
- Apps without a URL bar (e.g., React Native, Electron)
- Simulating navigation logic in isolated environments

### Step-by-Step Setup  

```ts
// 1. Import  
import { routeConfig, createMemoryHistory } from "mobx-route";

// 2. Update router configuration  
routeConfig.update({
  history: createMemoryHistory()
})
```
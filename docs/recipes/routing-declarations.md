# Routing declarations   

When building client-side routing for a web app, organizing routes effectively is crucial.  
The mobx-route library provides flexibility, but choosing the right structure for declaring routes can impact maintainability and scalability. Let’s explore two common patterns: the Separated and Collected approaches.  

## Separated way   

In this approach, routes are declared near with the components, views, or view models they represent. Each feature or page owns its route configuration, promoting modularity.  

Example Structure:  

_Home page_  
```tsx
// src/pages/home/view.tsx
export const HomePageView = () => <div>Home Page</div>;

// src/pages/home/route.ts
export const homeRoute = createRoute('/');

// src/pages/home/index.ts
export * from "./route";
export * from "./view";
```

_Death-star page_
```tsx
// src/pages/death-star/view.tsx
export const DeathStarPageView = () => <div>Death Star Page</div>;

// src/pages/death-star/route.ts
export const deathStarRoute = createRoute('/death-star');

// src/pages/death-star/index.ts
export * from "./route";
export const DeathStarPageView = loadable(async () => {
  const { DeathStarPageView } = await import ('./view');
  return DeathStarPageView
})
```

_App integration_
```tsx
// src/app/index.tsx
export const App = () => {
  return (
    <>
      <RouteView route={homeRoute} view={HomePageView} />
      <RouteView route={deathStarRoute} view={DeathStarPageView} />
    </>
  )
}
```

Usage:  
```ts
deathStarRoute.open();
```

**How It Works:**  
1. **Colocation**: Routes and components live in the same feature directory (e.g., **pages/home**), but are decoupled.  
2. **Explicit Binding**: The `RouteView` component connects a route to its view at the app level.  

**Pros:**  
- **Modularity**: Features encapsulate their own routes and views.  
- **Clear Ownership**: Teams can own entire features without conflicting with global routing.  
- **Testability**: Routes and views can be tested in isolation.  

**Cons:**
- **No Global map**: Navigation logic is distributed, making route hierarchy less visible.  


## Collected way   

In this approach, **all routes are centralized in a single configuration file**, providing a unified map of the application’s navigation structure. This emphasizes visibility and centralized control over routing logic.  


Example Structure:  

_routes configuration_   
```ts
// src/shared/config/routing/routes.ts

export const routes = {
  home: createRoute('/'),
  deathStar: createRoute('/death-star'),
}
```

_Home page_  
```tsx
// src/pages/home/view.tsx
export const HomePageView = () => <div>Home Page</div>;

// src/pages/home/index.ts
export * from "./view";
```

_Death-star page_
```tsx
// src/pages/death-star/view.tsx
export const DeathStarPageView = () => <div>Death Star Page</div>;

// src/pages/death-star/index.ts
export const DeathStarPageView = loadable(async () => {
  const { DeathStarPageView } = await import ('./view');
  return DeathStarPageView
})
```

_App integration_
```tsx
// src/app/index.tsx
export const App = () => {
  return (
    <>
      <RouteView route={routes.home} view={HomePageView} />
      <RouteView route={routes.deathStar} view={DeathStarPageView} />
    </>
  )
}
```

Usage:  
```ts
routes.deathStar.open();
```

**How It Works:**  
1. **Centralized Configuration**: All routes are defined in **routes.ts**, acting as the app’s navigation map.  
2. **Explicit Binding**: The `RouteView` component connects a route to its view at the app level.  

**Pros:**  
- **Single Source of Truth**: All paths are visible in one place, simplifying debugging.  

**Cons:**
- **Centralization Risks**: Overcrowding in large apps (100+ routes).  
- **Tight Coupling**: Features depend on the central route file, complicating independent development.  

## When to Use Each Approach
**Choose the Separated Way if**:
1. **Building large-scale apps**: Features are developed independently (e.g., micro-frontends).
2. **Prioritizing team autonomy**: Multiple teams own specific domains/pages.
3. **Emphasizing reusability**: Routes/views are shared across projects.

**Choose the Collected Way if**:
1. **Developing small/medium apps**: A centralized route map remains manageable.
4. **Prioritizing simplicity**: A single source of truth speeds up debugging.


## Final Recommendation  
- **Start with Collected Way** for prototypes or small apps – it’s faster to implement.
- **Migrate to Separated Way** as complexity grows or team size increases.
- **Combine patterns strategically**: Centralize core routes (e.g., auth, billing) while allowing feature-specific sub-routes.


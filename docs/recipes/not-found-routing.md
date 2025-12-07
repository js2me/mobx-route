# Not found routing   

To handle "not found" route behavior, you can achieve this using the `React` component `<RouteViewGroup />` along with either a `React` component or `VirtualRoute`.   

There are two ways to implement "not found" routing behaviour:   

## Redirect to another route   

1.  Create an instance of the `VirtualRoute` class   

In the behavior of this virtual route, it's crucial to implement a redirect to an existing route, for example, to the "home" page.   

```ts
import { createVirtualRoute } from "mobx-route";
import { homeRoute } from "@/pages/home"

export const notFoundRoute = createVirtualRoute({
  async open() {
    await homeRoute.open(null, { replace: true });
    return false;
  }
})
```

It's also important **not** to physically change the "open" state of this route. This line achieves that:

```ts{1}
    return false;
```

2. Connect this `notFoundRoute` to your `<RouteViewGroup />` component using [`otherwise` prop](/react/RouteViewGroup#otherwise)  

```tsx{7}
import { RouteViewGroup, RouteView } from "mobx-route/react"
import { notFoundRoute } from "@/pages/not-found"
...
export const App = () => {
  ...
  return (
    <RouteViewGroup otherwise={notFoundRoute}>
      <RouteView route={homeRoute} view={HomePage} />
    </RouteViewGroup>
  )
}
```

This way, when the `<RouteViewGroup/>` component determines that no internal route is open, it will open the `notFoundRoute`.  


### Alternative Approach    

You can simply specify as the last child element in the `<RouteViewGroup />` component a component that will render when no route is open:  


```tsx{19}
import { RouteViewGroup, RouteView } from "mobx-route/react"
import { homeRoute } from "@/pages/home"
import { useEffect } from "react"
...

const NotFoundComponent = () =>{
  useEffect(() => {
    homeRoute.open(null, { replace: true });
  }, [])

  return null
}

export const App = () => {
  ...
  return (
    <RouteViewGroup>
      <RouteView route={homeRoute} view={HomePage} />
      <NotFoundComponent />
    </RouteViewGroup>
  )
}
```

You can also use [`mobx-view-model`](https://js2me.github.io/mobx-view-model) and the [`<OnlyViewModel />` component](https://js2me.github.io/mobx-view-model/react/api/only-view-model).  



## Not found page     


1.  Create an instance of the `VirtualRoute` class   


```ts
import { createVirtualRoute } from "mobx-route";

export const notFoundRoute = createVirtualRoute({})
```

2. Connect this `notFoundRoute` to your `<RouteViewGroup />` component using [`otherwise` prop](/react/RouteViewGroup#otherwise) and create `RouteView` for this route    

```tsx{7,9}
import { RouteViewGroup, RouteView } from "mobx-route/react"
import { notFoundRoute } from "@/pages/not-found"
...
export const App = () => {
  ...
  return (
    <RouteViewGroup otherwise={notFoundRoute}>
      <RouteView route={homeRoute} view={HomePage} />
      <RouteView route={notFoundRoute} view={NotFoundPage} />
    </RouteViewGroup>
  )
}
```

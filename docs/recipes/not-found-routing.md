# Not found routing   

To handle "not found" route behavior, you can achieve this using the `React` component `<Switch />` along with either a `React` component or `VirtualRoute`.    

1.  Create an instance of the `VirtualRoute` class   

In the behavior of this virtual route, it's crucial to implement a redirect to an existing route, for example, to the "home" page.   

```ts
import { VirtualRoute } from "mobx-route";
import { homeRoute } from "@/pages/home"

export const notFoundRoute = new VirtualRoute({
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

2. Connect this `notFoundRoute` to your `<Switch />` component using [`default` prop](/react/Switch#default)  

```tsx{7}
import { Switch, RouteView } from "mobx-route/react"
import { notFoundRoute } from "@/pages/not-found"
...
export const App = () => {
  ...
  return (
    <Switch default={notFoundRoute}>
      <RouteView route={homeRoute} view={HomePage} />
    </Switch>
  )
}
```

This way, when the `<Switch/>` component determines that no internal route is open, it will open the `notFoundRoute`.  


## Alternative Approach    

You can simply specify as the last child element in the `<Switch />` component a component that will render when no route is open:  


```tsx{19}
import { Switch, RouteView } from "mobx-route/react"
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
    <Switch>
      <RouteView route={homeRoute} view={HomePage} />
      <NotFoundComponent />
    </Switch>
  )
}
```

You can also use [`mobx-view-model`](https://js2me.github.io/mobx-view-model) and the [`<OnlyViewModel />` component](https://js2me.github.io/mobx-view-model/react/api/only-view-model).  

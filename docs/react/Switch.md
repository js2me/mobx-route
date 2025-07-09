# Switch

React components which **renders only the first matching route**.   

### Example

```tsx
import { RouteView } from 'mobx-route/react';


const routes = {
  allOrders: new Route('/orders'),
  order: new Route('/orders/:orderId'),
}

function Routing() {
  return (
    <>
      <Switch>
        <RouteView route={routes.allOrders} component={AllOrders} />
        <RouteView route={routes.order} component={OrderDetails} />
        {/* 
          in mobx-route, any RouteView without provider route is considered always active. 
          This can be used to achieve "default" route behaviour within Switch. 
          Note: the order matters!
        */}
        <RouteView>This is rendered when nothing above has matched</RouteView>
      </Switch>;
    </>
  );
}
```


## Props   


### `default`   

This prop sets the "default" route to be opened when no other child routes are opened.   

Example:   
```tsx
<Switch default={defaultRouteToOpen}>
  <RouteView route={route1} />
  <RouteView route={route2} />
  <RouteView route={routeN} />
</Switch>
```

Also you can pass `string` as default url which is needed to navigate   

### `replace`   
This is additional navigation param for `default` prop   

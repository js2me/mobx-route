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

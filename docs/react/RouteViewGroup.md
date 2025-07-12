# RouteViewGroup

React components which **renders only the first matching route**.   

### Example

```tsx
import { RouteView, RouteViewGroup } from 'mobx-route/react';

const routes = {
  allOrders: new Route('/orders'),
  order: new Route('/orders/:orderId'),
}

function Routing() {
  return (
    <>
      <RouteViewGroup>
        <RouteView route={routes.allOrders} component={AllOrders} />
        <RouteView route={routes.order} component={OrderDetails} />
        {/* 
          in mobx-route, any RouteView without provider route is considered always active. 
          This can be used to achieve "otherwise" route behaviour within RouteViewGroup. 
          Note: the order matters!
        */}
        <RouteView>This is rendered when nothing above has matched</RouteView>
      </RouteViewGroup>;
    </>
  );
}
```


## Props   

### `layout`   
You can use this prop if you want to wrap all child `RouteViews` into React component  

```tsx{12}
const Layout = ({ children }) => {
  return (
    <div>
      <span>hello</span>
      {children}
    </div>
  )
}
...
route2.open()
...
<RouteViewGroup layout={Layout}>
  <RouteView route={route2}>
    <div>world</div>
  </RouteView>
</RouteViewGroup>
```
output:  
```html
<div>
  <div>
    <span>hello</span>
    <div>world</div>
  </div>
</div>
```

### `otherwise`   

This prop sets the "default" route to be opened when no other child routes are opened.   

Example:   
```tsx
<RouteViewGroup otherwise={otherwiseRouteToOpen}>
  <RouteView route={route1} />
  <RouteView route={route2} />
  <RouteView route={routeN} />
</RouteViewGroup>
```

Also you can pass `string` as default url which is needed to navigate   

### `replace`   
This is additional navigation param for `otherwise` prop   

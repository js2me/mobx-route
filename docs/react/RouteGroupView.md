# RouteGroupView

Creates route views for [`groupRoutes`](/core/groupRoutes).  

### Example

```tsx
import { RouteGroupView } from 'mobx-route/react';
import { routes } from '@/shared/config/routing';

function Routing() {
  return (
    <>
      <RouteGroupView
        group={routes.memes}
        views={{
          list: () => <div>list</div>,
          details: () => <div>details</div>,
        }}
      />
    </>
  );
}
```

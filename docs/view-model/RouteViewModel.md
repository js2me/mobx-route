# RouteViewModel

Abstract class for integration with [`mobx-view-model` library](https://js2me.github.io/mobx-view-model)  

### Example

```tsx
import { RouteViewModel } from 'mobx-route/view-model';
import { userRoute } from '@/shared/config/routing';
import { withViewModel } from "mobx-view-model";

class UserPageVM extends RouteViewModel<typeof userRoute> {
  route = userRoute;
}

export const UserPage = withViewModel(UserPageVM, () => {
  return <div>User page</div>
});
```

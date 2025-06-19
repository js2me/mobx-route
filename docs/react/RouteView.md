# RouteView

Creates route view.  

### Example

```tsx
import { RouteView, RouteViewProps } from 'mobx-route/react';
import { routes } from '@/shared/config/routing';

interface FeedPageProps extends RouteViewProps<typeof routes.feed> {}

const FeedPage = ({ params }: FeedPageProps) => {
  const { feedName } = params

  return (
    <div>
      Feed {feedName}
    </div>
  )
}

function Routing() {
  return (
    <>
      <RouteView route={routes.feed} view={FeedPage} />
      <RouteView route={routes.users} view={UsersPage} />
      <RouteView
        route={routes.userDetails}
        lazyView={async () =>
          (await import('@/pages/users/:userId')).UserDetailsPage
        }
        loader={GlobalLoader}
      />
      <RouteView route={routes.userDetails}>
        {(params, route) => (
          <div>{params.userId}</div>
        )}
      </RouteView>
    </>
  );
}
```

# Link

Navigates user to provided route on click. Has similar props with `<a>` element but instead of `href` has `route` and `params` props.

### Example

```tsx
import { Link } from 'mobx-route/react';
import { routes } from '@/shared/config/routing';

function Navbar({ user }) {
  return (
    <>
      <Link to={routes.users}>All users</Link>
      <Link to={routes.userDetails} params={{ userId: user.id }}>
        User details
      </Link>
      <Link to={"/custom-url"} replace>Custom url</Link>
      <Link to={"/custom-url/meme"} query={{ foo: 1, bar: 2 }}>
        Url with query params
      </Link>
    </>
  );
}
```

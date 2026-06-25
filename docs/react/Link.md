# Link

React link component.  
Renders an `<a>` bound to a route entity or URL. Click navigates via the configured `history` without a page reload; modifier/middle clicks and `target="_blank"` keep native behaviour.

## Props

- `to: AnyRoute | string` - target route entity or URL path.
- `href?: string` - direct href value (alternative to `to`).
- `params` - required for `to={route}` when route path has required params.
- `query?: IQueryParamsInput` - query params for generated URL.
- `replace?: boolean` - use `history.replace` instead of `history.push`.
- `state?: any` - history state payload.
- `mergeQuery?: boolean` - merge current query with provided query.
- `asChild?: boolean` - render props into child element instead of native `<a>`.

### Example

```tsx
import { Link } from 'mobx-route/react';
import { routes } from '@/shared/config/routing';
import { UiKitLink } from "@uikit";

function Navbar({ user }) {
  return (
    <>
      <Link to={routes.users}>All users</Link>
      <Link to={routes.userDetails} params={{ userId: user.id }}>
        User details
      </Link>
      <Link href="https://example.com" target="_blank" rel="noreferrer">
        External
      </Link>
      <Link to={"/custom-url"} replace>Custom url</Link>
      <Link to={"/custom-url/meme"} query={{ foo: 1, bar: 2 }}>
        Url with query params
      </Link>
      <Link to={"/feed"} asChild>
        <UiKitLink href=''>
          go to feed
        </UiKitLink>
      </Link>
    </>
  );
}
```

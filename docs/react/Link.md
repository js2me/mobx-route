# Link

Navigates on click using `routeConfig.history`.
Supports route entities, plain string paths, and direct `href`.

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

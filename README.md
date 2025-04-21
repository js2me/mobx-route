<img src="assets/logo.png" align="right" height="156" alt="logo" />

# mobx-route  

[![NPM version][npm-image]][npm-url] [![test status][github-test-actions-image]][github-actions-url] [![build status][github-build-actions-image]][github-actions-url] [![npm download][download-image]][download-url] [![bundle size][bundlephobia-image]][bundlephobia-url]


[npm-image]: http://img.shields.io/npm/v/mobx-route.svg
[npm-url]: http://npmjs.org/package/mobx-route
[github-build-actions-image]: https://github.com/js2me/mobx-route/workflows/Build/badge.svg
[github-test-actions-image]: https://github.com/js2me/mobx-route/workflows/Test/badge.svg
[github-actions-url]: https://github.com/js2me/mobx-route/actions
[download-image]: https://img.shields.io/npm/dm/mobx-route.svg
[download-url]: https://npmjs.org/package/mobx-route
[bundlephobia-url]: https://bundlephobia.com/result?p=mobx-route
[bundlephobia-image]: https://badgen.net/bundlephobia/minzip/mobx-route


Uses [`path-to-regexp` power](https://www.npmjs.com/package/path-to-regexp)  

```ts
import { Route } from "mobx-route";


const userDetails = new Route("/users/:id");

userDetails.navigate({ id: 1 }); // path params are required

const userMatrix = userDetails.extend('/matrix{/:matrixId}');

userMatrix.navigate({
  id: 1, // still required
  matrixId: '1', // optional because wrapped into {}
})

if (userMatrix.match) {
  console.log(userMatrix.match) // { path: string; params: { id: string; matrixId?: string } }
}

console.log(userMatrix.isMatches) // true


userMatrix.queryParams.update({
  bar: 1,
})

userMatrix.queryParams.data; // { bar: "1" }

```

## Integration with React   

```tsx
import { RouteView } from "mobx-route/react";

...
<RouteView route={userMatrix} view={YourComponent} />
```

## Integration with [`mobx-view-model`](https://js2me.github.io/mobx-view-model/)  

```tsx
import { RouteViewModel } from "mobx-route/view-model";
import { withViewModel } from "mobx-view-model";

...
class YourVM extends RouteViewModel<typeof userMatrix> {
  route = userMatrix;
}

export const YourComponent = withViewModel(YourVM)(YourComponentView);
```


# Examples   

```ts
const routes = {
  home: new Route('/'),
  apps: new RouteGroup({
    index: new Route('/apps', { index: true }),
    new: new Route('/apps/new'),
    details: new Route('/apps/:appId'),
  }),
}

history.pushState(null, '', '/apps');

routes.apps.index.isOpened; // true

routes.apps.details.open({ appId: 1 });

location.pathname; // /apps/1
```
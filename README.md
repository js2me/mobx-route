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
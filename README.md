<img src="assets/logo.png" align="right" width="156" alt="logo" />

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


_Uses [`path-to-regexp` power](https://www.npmjs.com/package/path-to-regexp)_  


## WIP  
## Documentation is [here](https://js2me.github.io/mobx-route)  


```ts
import { Route } from "mobx-route";

const userDetails = new Route("/users/:id");

userDetails.open({ id: 1 }); // path params are required

userDetails.isOpened; // true;
```

<img src="docs/public/logo.png" align="right" width="156" alt="logo" />

# mobx-route  

[![NPM version][npm-image]][npm-url] [![build status][github-build-actions-image]][github-actions-url] [![npm download][download-image]][download-url] [![bundle size][bundlephobia-image]][bundlephobia-url]


[npm-image]: http://img.shields.io/npm/v/mobx-route.svg
[npm-url]: http://npmjs.org/package/mobx-route
[github-build-actions-image]: https://github.com/js2me/mobx-route/workflows/Builds,%20tests%20&%20co/badge.svg
[github-actions-url]: https://github.com/js2me/mobx-route/actions
[download-image]: https://img.shields.io/npm/dm/mobx-route.svg
[download-url]: https://npmjs.org/package/mobx-route
[bundlephobia-url]: https://bundlephobia.com/result?p=mobx-route
[bundlephobia-image]: https://badgen.net/bundlephobia/minzip/mobx-route


🚀 Simple and lightweight typed MobX router 🚀    
_Uses [`path-to-regexp` power](https://www.npmjs.com/package/path-to-regexp)_  

### [Read the docs →](https://js2me.github.io/mobx-route/)  


```ts
import { Route } from "mobx-route";

const userDetails = new Route("/users/:id");

await userDetails.open({ id: 1 }); // path params are required

userDetails.isOpened; // true;
```

## Contribution Guide    

Want to contribute ? [Follow this guide](https://github.com/js2me/mobx-route/blob/master/CONTRIBUTING.md)  
# mobx-route

## 0.23.0

### Minor Changes

- [`087ab33`](https://github.com/js2me/mobx-route/commit/087ab3363d365699e73a07f985568e7475944fed) Thanks [@js2me](https://github.com/js2me)! - make href prop is Maybe for Link component

## 0.22.1

### Patch Changes

- [`4422689`](https://github.com/js2me/mobx-route/commit/4422689271f0a9f584d0a9bcec92cadffc5de433) Thanks [@js2me](https://github.com/js2me)! - fix `<Link />` component for more safety process props from bad users

- [`3255c7c`](https://github.com/js2me/mobx-route/commit/3255c7ce8349bdd4d812b3573f74fbc49656303f) Thanks [@js2me](https://github.com/js2me)! - fixed `beforeOpen` `false` case handling

## 0.22.0

### Minor Changes

- [`285385a`](https://github.com/js2me/mobx-route/commit/285385ab27ebdf31e306b3322a63fa08ef651814) Thanks [@js2me](https://github.com/js2me)! - add `useLastOpened` prop for `<RouteViewGroup/>`

- [`cf5d5ce`](https://github.com/js2me/mobx-route/commit/cf5d5ce0dc2ca751654daaad24d004f29b2a7a98) Thanks [@js2me](https://github.com/js2me)! - [internal] added more unit tests for virtual routes / routes

- [`cf5d5ce`](https://github.com/js2me/mobx-route/commit/cf5d5ce0dc2ca751654daaad24d004f29b2a7a98) Thanks [@js2me](https://github.com/js2me)! - BREAKING!: bump `mobx-view-model` **peer dependency** to 8.x + update yummies to 7.x (for `applyObservable` use)

- [`bd70ebf`](https://github.com/js2me/mobx-route/commit/bd70ebf04796b3a4b9d9305ebc9064243251389e) Thanks [@js2me](https://github.com/js2me)! - added async open\close methods for virtual routes

- [`bd70ebf`](https://github.com/js2me/mobx-route/commit/bd70ebf04796b3a4b9d9305ebc9064243251389e) Thanks [@js2me](https://github.com/js2me)! - realized beforeClose, afterOpen, beforeOpen lifecycle methods for virtual routes

### Patch Changes

- [`cf5d5ce`](https://github.com/js2me/mobx-route/commit/cf5d5ce0dc2ca751654daaad24d004f29b2a7a98) Thanks [@js2me](https://github.com/js2me)! - [internal] added unit tests for `routeConfig`

## 0.21.0

### Minor Changes

- [`14d9ff0`](https://github.com/js2me/mobx-route/commit/14d9ff0b41aeaab893d34aa117c13a7ac20d0004) Thanks [@js2me](https://github.com/js2me)! - added `fallbackPath` parameter for cases when `path-to-regexp` thrown an error

- [`14d9ff0`](https://github.com/js2me/mobx-route/commit/14d9ff0b41aeaab893d34aa117c13a7ac20d0004) Thanks [@js2me](https://github.com/js2me)! - safe building route urls using `path-to-regexp` lib

## 0.20.2

### Patch Changes

- [`24dcc38`](https://github.com/js2me/mobx-route/commit/24dcc38985b1e874d1c5fac72b5ec2affd75be51) Thanks [@js2me](https://github.com/js2me)! - fix passing exact parameter for extending routes + update docs

## 0.20.1

### Patch Changes

- [`3d31db2`](https://github.com/js2me/mobx-route/commit/3d31db2e777d26ca34a9a903380b1cad25fe1eaa) Thanks [@js2me](https://github.com/js2me)! - fixed <RouteViewGroup /> navigation with opening routes statements

## 0.20.0

### Minor Changes

- [`413223f`](https://github.com/js2me/mobx-route/commit/413223f4160530a8b9ecb80cd06f019701fdaf9c) Thanks [@js2me](https://github.com/js2me)! - added `exact` option for path routes

- [`397e1f8`](https://github.com/js2me/mobx-route/commit/397e1f8f4ae459c0dff4412e850a9b83265f0241) Thanks [@js2me](https://github.com/js2me)! - rewrite logic for `beforeOpen` hook for Route

## 0.19.0

### Minor Changes

- [`a233d78`](https://github.com/js2me/mobx-route/commit/a233d78e80ca4679229bd6710c6b1730bf281b25) Thanks [@js2me](https://github.com/js2me)! - added `unmount()` method call for `RouteViewModel` when route will be closed

- [`d2dfae5`](https://github.com/js2me/mobx-route/commit/d2dfae59aa334be7dba370f39388c7f7b8293cf6) Thanks [@js2me](https://github.com/js2me)! - modified matcher path regexp for parent routes (when /a/b route is opened then /a route should be opened too)

### Patch Changes

- [`2ff886d`](https://github.com/js2me/mobx-route/commit/2ff886d93d4cb745be5f03d41ff0f0d32909e065) Thanks [@js2me](https://github.com/js2me)! - [internal] build modification

## 0.18.0

### Minor Changes

- [`784ad4c`](https://github.com/js2me/mobx-route/commit/784ad4cae379eb472a716667a1b19a7f5b58eab3) Thanks [@js2me](https://github.com/js2me)! - [internal] migration to mobx-location-history 9.x

## 0.17.0

### Minor Changes

- [`0d99dfb`](https://github.com/js2me/mobx-route/commit/0d99dfb2edff76f61ea04b1e7e4bf8c7a18e77b9) Thanks [@js2me](https://github.com/js2me)! - [internal] migration to yummies 6.x

## 0.16.2

### Patch Changes

- [`988ca41`](https://github.com/js2me/mobx-route/commit/988ca41bd2aa2a4ae6efc9b7250ead77af9ac949) Thanks [@js2me](https://github.com/js2me)! - try to fix bad typings for view-model section (after using zshy)

## 0.16.1

### Patch Changes

- [`24ca151`](https://github.com/js2me/mobx-route/commit/24ca15126dbeeaf2a8176ed83cbe99b1cdc86628) Thanks [@js2me](https://github.com/js2me)! - fix zshy incorrect bundle

## 0.16.0

### Minor Changes

- [`0545391`](https://github.com/js2me/mobx-route/commit/0545391fcc780cb14ca27205ed4b17556fd33f27) Thanks [@js2me](https://github.com/js2me)! - refactor bundle using zshy

### Patch Changes

- [`63e341d`](https://github.com/js2me/mobx-route/commit/63e341d84ab7d9fe4f3a90349d7c13534ce190ca) Thanks [@js2me](https://github.com/js2me)! - update docs layout

## 0.15.0

### Minor Changes

- [`eb9ebb2`](https://github.com/js2me/mobx-route/commit/eb9ebb246546733f8ac3de4692430a16e7fc195a) Thanks [@js2me](https://github.com/js2me)! - support 8.0.0 version of `mobx-view-model`

## 0.14.2

### Patch Changes

- [`cd93a9e`](https://github.com/js2me/mobx-route/commit/cd93a9e7620bb0cbe7c865c4f33f178d796fe193) Thanks [@js2me](https://github.com/js2me)! - update mobx-location-history to 8.1.1

## 0.14.1

### Patch Changes

- [`570d002`](https://github.com/js2me/mobx-route/commit/570d002d654f4b0e8d2a7fa0e1de6dc947890dd5) Thanks [@js2me](https://github.com/js2me)! - [internal] use unified biome config

- [`30ca924`](https://github.com/js2me/mobx-route/commit/30ca924e5e74d3555fee0bb4527b8e4988b3bc39) Thanks [@js2me](https://github.com/js2me)! - update `mobx-location-history` to latest

## 0.14.0

### Minor Changes

- [`39a4a40`](https://github.com/js2me/mobx-route/commit/39a4a40be52464d7adf158d1ffe582ba9ddca2ba) Thanks [@js2me](https://github.com/js2me)! - added `formatLinkHref` global route config option

- [`c4a8336`](https://github.com/js2me/mobx-route/commit/c4a8336ed044723b52a8fa50aec72b0d2fea87d2) Thanks [@js2me](https://github.com/js2me)! - added baseUrl override ability for `createUrl`

## 0.13.0

### Minor Changes

- [`09be673`](https://github.com/js2me/mobx-route/commit/09be6735ab62a8406debde37bdfefd9ac5b085c1) Thanks [@js2me](https://github.com/js2me)! - update `mobx-location-history` to `8.x.x`

## 0.12.2

### Patch Changes

- [`0933b95`](https://github.com/js2me/mobx-route/commit/0933b9543d76a2f87f9c5ee316963920a1ada9b7) Thanks [@js2me](https://github.com/js2me)! - fixed navigation with passed query params in link when `to` is string

## 0.12.1

### Patch Changes

- [`46eab98`](https://github.com/js2me/mobx-route/commit/46eab98fa76cf7a05f2a4152b2f518ff97551c41) Thanks [@js2me](https://github.com/js2me)! - fixed `<Link/>` component (navigation)

## 0.12.0

### Minor Changes

- [`6e7c12c`](https://github.com/js2me/mobx-route/commit/6e7c12c234169eb9b1735652ad32e0212ca2034f) Thanks [@js2me](https://github.com/js2me)! - `createUrl` option for `routeConfig`

## 0.11.0

### Minor Changes

- [`a35efa0`](https://github.com/js2me/mobx-route/commit/a35efa0384bb17528cc163dc88ee22fee484359f) Thanks [@js2me](https://github.com/js2me)! - ability to customize url before route open/ creating url (`createUrl` param)

## 0.10.2

### Patch Changes

- [`e07c69d`](https://github.com/js2me/mobx-route/commit/e07c69de568fd0145504c1f52670163b1079d317) Thanks [@js2me](https://github.com/js2me)! - fixed output params typings in extended route (receive typings from parent)

## 0.10.1

### Patch Changes

- [`79df550`](https://github.com/js2me/mobx-route/commit/79df55031aaebd38e30ee00df6674421ab349bdd) Thanks [@js2me](https://github.com/js2me)! - fixed `extend()` method with transfer input param typings

## 0.10.0

### Minor Changes

- [`3405fc8`](https://github.com/js2me/mobx-route/commit/3405fc8aae294338b0efe2d25ccb5f432fda6896) Thanks [@js2me](https://github.com/js2me)! - added docs for `mergeQuery` feature

### Patch Changes

- [`e065e8e`](https://github.com/js2me/mobx-route/commit/e065e8e5eaaa2306aedd5f2504ad271d4e35ce3b) Thanks [@js2me](https://github.com/js2me)! - fixed building url for link component with mergeQuery option

## 0.9.1

### Patch Changes

- [`fc47412`](https://github.com/js2me/mobx-route/commit/fc4741200e0a1376e70db59173bfdf853adacdff) Thanks [@js2me](https://github.com/js2me)! - fixed `mergeQuery` option use in Link react component

- [`76e6b1e`](https://github.com/js2me/mobx-route/commit/76e6b1e10a6e1d89cab2362ebaee08f12308b695) Thanks [@js2me](https://github.com/js2me)! - fixed mergeQuery option behaviour

## 0.9.0

### Minor Changes

- [`9e8dc8e`](https://github.com/js2me/mobx-route/commit/9e8dc8ed88a79bad25f0f06a40abb37bc5ab4a85) Thanks [@js2me](https://github.com/js2me)! - added `mergeQuery` feature to merge existed query with new one

## 0.8.1

### Patch Changes

- [`417f9ab`](https://github.com/js2me/mobx-route/commit/417f9ab6925f71069e6cef01d1dd80ba0c8ae7d8) Thanks [@js2me](https://github.com/js2me)! - fixed `Link` component (external navigation with target)

## 0.8.0

### Minor Changes

- [`c317d9d`](https://github.com/js2me/mobx-route/commit/c317d9dcff60b88d46516afedd10aacd8ee0315d) Thanks [@js2me](https://github.com/js2me)! - [internal] migration from eslint to biome

- [`c317d9d`](https://github.com/js2me/mobx-route/commit/c317d9dcff60b88d46516afedd10aacd8ee0315d) Thanks [@js2me](https://github.com/js2me)! - fixed `RouteViewGroup` typings (bug after support React 19)

## 0.7.0

### Minor Changes

- [`1e48cb5`](https://github.com/js2me/mobx-route/commit/1e48cb51106fdb1e4c5154f79d1a19bf5e838bab) Thanks [@js2me](https://github.com/js2me)! - support `mobx-view-model` `7.x` version

- [`68fa58b`](https://github.com/js2me/mobx-route/commit/68fa58b81ce1b6edde299dccfcbeb69dd32b8f63) Thanks [@js2me](https://github.com/js2me)! - fix react 19 version usage typings

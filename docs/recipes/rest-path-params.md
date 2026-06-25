# Rest path params

Catch “the rest of the path” after a fixed prefix — useful for file-like URLs or proxy paths:

```ts
const serviceRoute = createRoute('/services/:serviceId{/*rest}');

serviceRoute.open({ serviceId: 'api', rest: ['v1', 'users'] });
// → /services/api/v1/users
```

Syntax follows [path-to-regexp](https://www.npmjs.com/package/path-to-regexp).

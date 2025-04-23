# RouteGroup

Class for groupping routes

### Basic example

```ts
const routesGroup = new RouteGroup({
  index: new Route('/', { index: true }),
  fruits: new Route('/fruits'),
  zombies: new Route('/zombies'),
  memes: new RouteGroup({
    index: new Route('/memes', { index: true }),
    list: new Route('/memes/list'),
    create: new Route('/memes/create'),
    edit: new Route('/memes/edit/:id'),
  }),
})
```

# Route  

Creates a route.   
Routes are self-contained entities and do not require binding to a router.   

You can track their open state using the `isOpened` property, and also "open" the route using the `open()` method.   

### Basic example

```ts
const users = new Route('/users');
users.open();

const userDetails = users.extend('/:userId');
userDetails.open({ userId: 1 });

const userPhotos = userDetails.extend('/photos');
userPhotos.open({ userId: 1 });

userPhotos.isOpened; // true;
location.pathname; // /users/1/photos
```

### Route path   

The route path is built using the [path-to-regexp](https://www.npmjs.com/package/path-to-regexp) library.
The path itself is specified as the first parameter when creating an instance of the `Route` class.  

So you can use all power of this library with TypeScript support out-of-box   
```ts
const route = new Route('/*segment');

route.open({
  segment: [1,2,3]
})
```


## Methods and properties  

### open(params, otherParams)   

### extend(path, config)  

### isIndex  

### isOpened  

### params  

### currentPath  

### hasOpenedChildren  

### createUrl(params, query)  
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

### `open(params?, { query?, replace? })`   

Navigates to this route.   
First argument can be required based on path declaration (first argument)  

Examples:  
```ts
const stars = new Route('/stars');
stars.open();
location.pathname; // /stars
```

```ts
const starDetails = new Route('/stars/:starId');
starDetails.open({ starId: 1 });

const starsWithMeta = new Route('/stars{/:meta}');
starsWithMeta();
starsWithMeta({ meta: 1 });
```

### `extend(path, config): Route`  
Allows to create child route based on this route with merging this route path and extending path.   
Example:
```ts
const stars = new Route('/stars');
const starDetails = stars.extends('/:starId');
starDetails.path; // '/stars/:starId'
starDetails.open({ starId: 1 });
location.pathname; // /stars/1
```

### `isIndex: boolean`  


### `isOpened: boolean` <Badge type="tip" text="computed" />   

Defines the "open" state for this route.   
Example:  
```ts
const stars = new Route('/stars');
stars.open();
stars.isOpened; // true
```


### `params: ParsedPathParams | null`  <Badge type="tip" text="computed" />  

### `currentPath: ParsedPathName | null` <Badge type="tip" text="computed" />   

### `hasOpenedChildren: boolean` <Badge type="tip" text="computed" />   

### `children: AnyRoute[]` <Badge type="info" text="observable" />   

### `createUrl(params?, query?): string`  

Creates url based on this route configuration   
Example:   
```ts
const starDetails = new Route('/stars/:starId');
starDetails.createUrl({ starId: 1 }, { bar: 1 }); // /stars/1?bar=1
```

### `path: string`  
Route path declaration  
Example:   
```ts
const starDetails = new Route('/stars/:starId');
starDetails.path; // /stars/:starId
```

### `addChildren(...routes: AnyRoute[]): void` <Badge type="info" text="action" />     

### `removeChildren(...routes: AnyRoute[]): void` <Badge type="info" text="action" />     
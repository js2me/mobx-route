# Rest path params   

Follow [documentation of the `path-to-regexp` npm package](https://www.npmjs.com/package/path-to-regexp)  

Example:  
```ts
import { Route } from "mobx-route";

export const serviceRoute = new Route('/services/:serviceId{/*rest}');
```
# Rest path params   

Follow [documentation of the `path-to-regexp` npm package](https://www.npmjs.com/package/path-to-regexp)  

Example:  
```ts
import { createRoute } from "mobx-route";

export const serviceRoute = createRoute('/services/:serviceId{/*rest}');
```
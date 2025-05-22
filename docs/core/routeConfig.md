# routeConfig

Global route configuration.   
This object contains all global options for some behaviour of route and router instances  

## Basic example

```ts
import { routeConfig, History } from "mobx-route";

const yourHistory = new History()

routeConfig.update({
  history: yourHistory,
  baseUrl: '/',
  useHashRouting: false, // default - false
});

routeConfig.get();
```

## Fields   

### `history`  
This is instance of the `History` class from [`mobx-location-history` package](https://github.com/js2me/mobx-location-history).  
This class is also can be exported from `mobx-route` package.  

### `location`  
This is instance of the `Location` class from [`mobx-location-history` package](https://github.com/js2me/mobx-location-history)  
This class is also can be exported from `mobx-route` package.  

### `queryParams`  
This is instance of the `QueryParams` class from [`mobx-location-history` package](https://github.com/js2me/mobx-location-history)  
This class is also can be exported from `mobx-route` package.  

### `baseUrl`

Specifies the base URL for all routes. This is used as a prefix for every route path and helps in forming complete URLs relative to this base. It's particularly useful when your application is not hosted at the root of a domain and you need consistent URL structures.  

### `useHashRouting`  
Enables or disables hash routing.  
Default is `false`.  
